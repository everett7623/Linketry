import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';

/**
 * D1 批量操作辅助工具
 *
 * 注意：此模块供 db/index.ts 内部调用，不直接用于路由处理器。
 * 遵守 CLAUDE.md：所有对外暴露的 D1 SQL 操作集中在 db/index.ts。
 */

// ---------------------------------------------------------------------------
// 安全校验
// ---------------------------------------------------------------------------

/** SQLite/D1 安全标识符（字母/数字/下划线，不以数字开头）*/
const SAFE_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * 校验 SQL 标识符（表名、列名）格式，防止注入。
 * D1 不支持参数化标识符，因此必须通过白名单格式来保证安全。
 */
function assertSafeIdentifier(name: string, context: string): void {
  if (!SAFE_IDENTIFIER_RE.test(name)) {
    throw new Error(`Unsafe SQL identifier in ${context}: "${name}"`);
  }
}

// ---------------------------------------------------------------------------
// 批量插入
// ---------------------------------------------------------------------------

/**
 * 批量插入记录，自动分批处理避免单次操作过大。
 *
 * 前提：
 * - `table` 和所有字段名必须是安全标识符（字母/数字/下划线）
 * - 所有 `records` 必须具有相同的字段集合（以第一条为准）
 *
 * @throws 标识符不合法 或 记录字段不一致 时抛出错误
 */
export async function batchInsert<T extends Record<string, any>>(
  db: D1Database,
  table: string,
  records: T[],
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<number> {
  const { batchSize = 100, onProgress } = options;

  if (records.length === 0) return 0;

  // 校验表名
  assertSafeIdentifier(table, 'batchInsert table');

  // 以第一条记录为准确定字段集
  const canonicalFields = Object.keys(records[0]);
  canonicalFields.forEach(f => assertSafeIdentifier(f, 'batchInsert field'));

  // 校验所有记录字段一致，防止异构记录静默写入 NULL
  for (let idx = 1; idx < records.length; idx++) {
    const keys = Object.keys(records[idx]);
    if (
      keys.length !== canonicalFields.length ||
      !canonicalFields.every(f => Object.prototype.hasOwnProperty.call(records[idx], f))
    ) {
      throw new Error(
        `batchInsert: record[${idx}] fields [${keys}] differ from canonical [${canonicalFields}]`
      );
    }
  }

  const placeholders = canonicalFields.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${canonicalFields.join(', ')}) VALUES (${placeholders})`;

  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // 在批次内复用同一个预编译语句，而非每条记录各 prepare 一次
    const stmt = db.prepare(sql);
    const statements = batch.map(record => {
      const values = canonicalFields.map(field => record[field]);
      return stmt.bind(...values);
    });

    await db.batch(statements);
    inserted += batch.length;

    if (onProgress) {
      onProgress(inserted, records.length);
    }
  }

  return inserted;
}

// ---------------------------------------------------------------------------
// 批量更新
// ---------------------------------------------------------------------------

/**
 * 批量更新记录。
 * `table`、`set` 的键、`where` 的键必须是安全标识符。
 */
export async function batchUpdate(
  db: D1Database,
  table: string,
  updates: Array<{ where: Record<string, any>; set: Record<string, any> }>,
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<number> {
  const { batchSize = 100, onProgress } = options;

  if (updates.length === 0) return 0;

  assertSafeIdentifier(table, 'batchUpdate table');

  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const statements = batch.map(({ where, set }) => {
      Object.keys(set).forEach(k => assertSafeIdentifier(k, 'batchUpdate SET field'));
      Object.keys(where).forEach(k => assertSafeIdentifier(k, 'batchUpdate WHERE field'));

      const setClause = Object.keys(set).map(k => `${k} = ?`).join(', ');
      const whereClause = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

      const values = [...Object.values(set), ...Object.values(where)];
      return db.prepare(sql).bind(...values);
    });

    await db.batch(statements);
    updated += batch.length;

    if (onProgress) {
      onProgress(updated, updates.length);
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// 批量删除
// ---------------------------------------------------------------------------

/**
 * 批量删除记录。
 * `table` 和 `conditions` 的键必须是安全标识符。
 */
export async function batchDelete(
  db: D1Database,
  table: string,
  conditions: Array<Record<string, any>>,
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<number> {
  const { batchSize = 100, onProgress } = options;

  if (conditions.length === 0) return 0;

  assertSafeIdentifier(table, 'batchDelete table');

  let deleted = 0;

  for (let i = 0; i < conditions.length; i += batchSize) {
    const batch = conditions.slice(i, i + batchSize);

    const statements = batch.map(where => {
      Object.keys(where).forEach(k => assertSafeIdentifier(k, 'batchDelete WHERE field'));
      const whereClause = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      return db.prepare(sql).bind(...Object.values(where));
    });

    await db.batch(statements);
    deleted += batch.length;

    if (onProgress) {
      onProgress(deleted, conditions.length);
    }
  }

  return deleted;
}

// ---------------------------------------------------------------------------
// 预编译语句缓存
// ---------------------------------------------------------------------------

/**
 * 预编译语句缓存管理器。
 * 注意：同一个 `key` 必须始终对应同一条 SQL；传入不同 SQL 会返回首次缓存的版本。
 */
export class PreparedStatementCache {
  private cache: Map<string, D1PreparedStatement> = new Map();

  constructor(private db: D1Database) {}

  /**
   * 获取预编译语句。同一 key 首次调用时 prepare，后续复用。
   * 警告：同一 key 传入不同 sql 时，将静默返回首次缓存的语句——调用方需保证 key 与 sql 的对应关系稳定。
   */
  get(key: string, sql: string): D1PreparedStatement {
    if (!this.cache.has(key)) {
      this.cache.set(key, this.db.prepare(sql));
    }
    return this.cache.get(key)!;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ---------------------------------------------------------------------------
// 批量查询
// ---------------------------------------------------------------------------

/**
 * 批量 IN 查询，避免 N+1 问题。
 * `table`、`field`、`selectFields` 的元素必须是安全标识符。
 */
export async function batchQuery<T>(  // 移除无用的 K extends keyof T
  db: D1Database,
  table: string,
  field: string,
  values: any[],
  options: {
    batchSize?: number;
    selectFields?: string[];
  } = {}
): Promise<T[]> {
  const { batchSize = 100, selectFields = ['*'] } = options;

  if (values.length === 0) return [];

  assertSafeIdentifier(table, 'batchQuery table');
  assertSafeIdentifier(field, 'batchQuery field');
  selectFields.forEach(f => {
    if (f !== '*') assertSafeIdentifier(f, 'batchQuery selectField');
  });

  const results: T[] = [];

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const placeholders = batch.map(() => '?').join(', ');
    const sql = `SELECT ${selectFields.join(', ')} FROM ${table} WHERE ${field} IN (${placeholders})`;

    const result = await db.prepare(sql).bind(...batch).all();
    if (result.results) {
      results.push(...(result.results as T[]));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 事务（D1 batch = 原子操作）
// ---------------------------------------------------------------------------

export async function transaction(
  db: D1Database,
  operations: D1PreparedStatement[]
): Promise<void> {
  if (operations.length === 0) return;
  await db.batch(operations);
}

// ---------------------------------------------------------------------------
// 批量 upsert
// ---------------------------------------------------------------------------

/**
 * 批量 upsert（SQLite INSERT OR REPLACE）。
 * 前提同 batchInsert：标识符安全 + 记录字段一致。
 */
export async function batchUpsert<T extends Record<string, any>>(
  db: D1Database,
  table: string,
  records: T[],
  uniqueFields: string[],  // 保留参数以备扩展；目前 INSERT OR REPLACE 依赖表的主键/唯一约束
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<number> {
  const { batchSize = 100, onProgress } = options;

  if (records.length === 0) return 0;

  assertSafeIdentifier(table, 'batchUpsert table');

  const canonicalFields = Object.keys(records[0]);
  canonicalFields.forEach(f => assertSafeIdentifier(f, 'batchUpsert field'));

  // 校验字段一致性
  for (let idx = 1; idx < records.length; idx++) {
    const keys = Object.keys(records[idx]);
    if (
      keys.length !== canonicalFields.length ||
      !canonicalFields.every(f => Object.prototype.hasOwnProperty.call(records[idx], f))
    ) {
      throw new Error(
        `batchUpsert: record[${idx}] fields [${keys}] differ from canonical [${canonicalFields}]`
      );
    }
  }

  const placeholders = canonicalFields.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${canonicalFields.join(', ')}) VALUES (${placeholders})`;

  let upserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const stmt = db.prepare(sql);
    const statements = batch.map(record => {
      const values = canonicalFields.map(f => record[f]);
      return stmt.bind(...values);
    });

    await db.batch(statements);
    upserted += batch.length;

    if (onProgress) {
      onProgress(upserted, records.length);
    }
  }

  return upserted;
}

// ---------------------------------------------------------------------------
// 分页批量处理
// ---------------------------------------------------------------------------

/**
 * 对 `query` 的全量结果逐页处理，避免一次性加载所有数据。
 *
 * 限制：`query` 不得包含 LIMIT 或 OFFSET 关键字，本函数会自动追加分页子句。
 *
 * @throws query 中已含 LIMIT/OFFSET 时抛出错误，防止产生双重 LIMIT
 */
export async function processInPages<T>(
  db: D1Database,
  query: string,
  processor: (items: T[]) => Promise<void>,
  options: {
    pageSize?: number;
    maxPages?: number;
  } = {}
): Promise<number> {
  const { pageSize = 100, maxPages = Infinity } = options;

  // 防止双重 LIMIT：调用方不应在 query 中包含分页子句
  if (/\b(LIMIT|OFFSET)\b/i.test(query)) {
    throw new Error(
      'processInPages: query must not contain LIMIT or OFFSET — they are added internally'
    );
  }

  let processed = 0;
  let page = 0;

  while (page < maxPages) {
    const offset = page * pageSize;
    const sql = `${query} LIMIT ${pageSize} OFFSET ${offset}`;

    const result = await db.prepare(sql).all();

    if (!result.results || result.results.length === 0) break;

    await processor(result.results as T[]);
    processed += result.results.length;

    if (result.results.length < pageSize) break;

    page++;
  }

  return processed;
}
