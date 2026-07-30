import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';

/**
 * D1 批量操作辅助工具
 * 用于优化大量数据的插入、更新和删除操作
 */

/**
 * 批量插入记录
 * 自动分批处理，避免单次操作过大
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

  // 获取字段名
  const fields = Object.keys(records[0]);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

  let inserted = 0;

  // 分批处理
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // 创建批量语句
    const statements = batch.map(record => {
      const values = fields.map(field => record[field]);
      return db.prepare(sql).bind(...values);
    });

    // 执行批量操作
    await db.batch(statements);
    inserted += batch.length;

    // 报告进度
    if (onProgress) {
      onProgress(inserted, records.length);
    }
  }

  return inserted;
}

/**
 * 批量更新记录
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

  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const statements = batch.map(({ where, set }) => {
      const setFields = Object.keys(set).map(k => `${k} = ?`).join(', ');
      const whereFields = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `UPDATE ${table} SET ${setFields} WHERE ${whereFields}`;

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

/**
 * 批量删除记录
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

  let deleted = 0;

  for (let i = 0; i < conditions.length; i += batchSize) {
    const batch = conditions.slice(i, i + batchSize);

    const statements = batch.map(where => {
      const whereFields = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `DELETE FROM ${table} WHERE ${whereFields}`;
      const values = Object.values(where);
      return db.prepare(sql).bind(...values);
    });

    await db.batch(statements);
    deleted += batch.length;

    if (onProgress) {
      onProgress(deleted, conditions.length);
    }
  }

  return deleted;
}

/**
 * 预编译语句管理器
 * 缓存常用查询的预编译语句以提高性能
 */
export class PreparedStatementCache {
  private cache: Map<string, D1PreparedStatement> = new Map();

  constructor(private db: D1Database) {}

  /**
   * 获取或创建预编译语句
   */
  get(key: string, sql: string): D1PreparedStatement {
    if (!this.cache.has(key)) {
      this.cache.set(key, this.db.prepare(sql));
    }
    return this.cache.get(key)!;
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 批量查询优化器
 * 避免 N+1 查询问题
 */
export async function batchQuery<T, K extends keyof T>(
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

  const results: T[] = [];

  // 分批查询
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const placeholders = batch.map(() => '?').join(', ');
    const sql = `
      SELECT ${selectFields.join(', ')}
      FROM ${table}
      WHERE ${field} IN (${placeholders})
    `;

    const result = await db.prepare(sql).bind(...batch).all();
    if (result.results) {
      results.push(...(result.results as T[]));
    }
  }

  return results;
}

/**
 * 事务式批量操作
 * 使用 D1 的 batch API 确保原子性
 */
export async function transaction(
  db: D1Database,
  operations: D1PreparedStatement[]
): Promise<void> {
  if (operations.length === 0) return;

  // D1 的 batch 是原子操作
  await db.batch(operations);
}

/**
 * 批量 upsert（插入或更新）
 * SQLite 使用 INSERT OR REPLACE
 */
export async function batchUpsert<T extends Record<string, any>>(
  db: D1Database,
  table: string,
  records: T[],
  uniqueFields: string[],
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<number> {
  const { batchSize = 100, onProgress } = options;

  if (records.length === 0) return 0;

  const fields = Object.keys(records[0]);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

  let upserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const statements = batch.map(record => {
      const values = fields.map(field => record[field]);
      return db.prepare(sql).bind(...values);
    });

    await db.batch(statements);
    upserted += batch.length;

    if (onProgress) {
      onProgress(upserted, records.length);
    }
  }

  return upserted;
}

/**
 * 分页批量处理
 * 用于处理大量数据而不会一次性加载所有数据
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

  let processed = 0;
  let page = 0;
  let hasMore = true;

  while (hasMore && page < maxPages) {
    const offset = page * pageSize;
    const sql = `${query} LIMIT ${pageSize} OFFSET ${offset}`;

    const result = await db.prepare(sql).all();

    if (!result.results || result.results.length === 0) {
      hasMore = false;
      break;
    }

    await processor(result.results as T[]);
    processed += result.results.length;

    if (result.results.length < pageSize) {
      hasMore = false;
    }

    page++;
  }

  return processed;
}
