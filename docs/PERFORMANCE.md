# 性能优化指南

本指南提供 Linketry 性能优化的最佳实践和具体方法。

---

## 性能目标

### 重定向性能

| 指标 | 目标 | 临界值 |
|------|------|--------|
| KV 缓存命中 | < 50ms | < 100ms |
| D1 查询（未缓存）| < 200ms | < 500ms |
| 总重定向时间 (P95) | < 150ms | < 300ms |
| KV 命中率 | > 90% | > 70% |

### Admin 性能

| 指标 | 目标 | 临界值 |
|------|------|--------|
| 首屏加载 (FCP) | < 1.5s | < 3s |
| 可交互时间 (TTI) | < 2.5s | < 5s |
| API 响应时间 | < 200ms | < 500ms |
| 大列表渲染 | < 100ms | < 300ms |

---

## 1. 重定向性能优化

### 1.1 KV 缓存策略

**当前实现**：

```typescript
// apps/worker/src/cache/index.ts
const key = `linketry:slug:${domain}:${slug}`;
const cached = await kv.get(key, 'json');

if (cached) {
  // 重新验证 D1 状态
  const link = await getLink(env.DB, domain, slug);
  if (link && link.status === 'active') {
    return Response.redirect(link.long_url, link.redirect_type);
  }
}
```

**优化方案**：

#### A. 批量预热热门链接

```typescript
// apps/worker/src/cache/warmup.ts
export async function warmupPopularLinks(env: Env) {
  const popular = await env.DB.prepare(`
    SELECT domain, slug, long_url, redirect_type, status, expires_at, max_clicks, click_count
    FROM links 
    WHERE click_count > 100 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND (max_clicks IS NULL OR click_count < max_clicks)
    ORDER BY click_count DESC
    LIMIT 1000
  `).all();
  
  const batch: Promise<void>[] = [];
  
  for (const link of popular.results) {
    batch.push(
      setCachedLink(env.KV, link.domain, link.slug, {
        long_url: link.long_url,
        redirect_type: link.redirect_type,
        status: link.status,
        expires_at: link.expires_at,
        max_clicks: link.max_clicks,
        click_count: link.click_count
      })
    );
    
    // 批量处理，避免一次性太多
    if (batch.length >= 50) {
      await Promise.all(batch);
      batch.length = 0;
    }
  }
  
  if (batch.length > 0) {
    await Promise.all(batch);
  }
}

// 在 Cron 中调用
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (event.cron === '0 */6 * * *') {  // 每 6 小时
      ctx.waitUntil(warmupPopularLinks(env));
    }
  }
}
```

#### B. 智能 TTL 策略

> **状态**：提案，尚未实现。当前 `calculateTTL` 为固定 24 小时，仅按 `expires_at` 压缩（不按点击量分级，也不按 `max_clicks` 压缩）。下方为按点击量分级的参考实现。

```typescript
// apps/worker/src/cache/index.ts
export async function setCachedLinkWithSmartTTL(
  kv: KVNamespace,
  domain: string,
  slug: string,
  link: CachedLink
) {
  const key = `linketry:slug:${domain}:${slug}`;
  
  // 根据点击量调整 TTL
  let ttl = 86400; // 默认 24 小时
  
  if (link.click_count > 1000) {
    ttl = 604800; // 7 天（热门链接）
  } else if (link.click_count > 100) {
    ttl = 259200; // 3 天（常用链接）
  } else if (link.click_count < 10) {
    ttl = 3600; // 1 小时（冷门链接）
  }
  
  // 如果有过期时间，不超过过期时间
  if (link.expires_at) {
    const expiresIn = new Date(link.expires_at).getTime() - Date.now();
    ttl = Math.min(ttl, Math.floor(expiresIn / 1000));
  }
  
  await kv.put(key, JSON.stringify(link), { expirationTtl: ttl });
}
```

### 1.2 D1 查询优化

**当前查询**：

```sql
SELECT * FROM links WHERE domain = ? AND slug = ?
```

**优化建议**：

#### A. 添加复合索引

```sql
-- migrations/0003_performance_indexes.sql

-- 主查询索引（domain + slug）
CREATE INDEX IF NOT EXISTS idx_links_domain_slug 
ON links(domain, slug) WHERE status = 'active';

-- 热门链接查询索引
CREATE INDEX IF NOT EXISTS idx_links_click_count 
ON links(click_count DESC) WHERE status = 'active';

-- 访问统计查询索引
CREATE INDEX IF NOT EXISTS idx_visits_link_timestamp 
ON visits(link_id, timestamp);

-- 分析维度索引
CREATE INDEX IF NOT EXISTS idx_visits_dimensions 
ON visits(link_id, country, device, timestamp);
```

#### B. 优化查询字段

```typescript
// apps/worker/src/db/index.ts
export async function getLinkForRedirect(
  db: D1Database,
  domain: string,
  slug: string
): Promise<RedirectLink | null> {
  // 只查询重定向需要的字段
  const result = await db.prepare(`
    SELECT 
      id, 
      long_url, 
      redirect_type, 
      status, 
      expires_at, 
      max_clicks, 
      click_count,
      password_hash,
      warning_enabled
    FROM links 
    WHERE domain = ? AND slug = ?
    AND status = 'active'
    LIMIT 1
  `).bind(domain, slug).first();
  
  return result || null;
}
```

#### C. 使用 D1 预编译语句

```typescript
// apps/worker/src/db/prepared.ts
export class PreparedStatements {
  private statements: Map<string, D1PreparedStatement> = new Map();
  
  constructor(private db: D1Database) {}
  
  getLinkBySlug(): D1PreparedStatement {
    if (!this.statements.has('getLinkBySlug')) {
      this.statements.set(
        'getLinkBySlug',
        this.db.prepare(`
          SELECT id, long_url, redirect_type, status, expires_at, max_clicks, click_count
          FROM links 
          WHERE domain = ? AND slug = ?
          AND status = 'active'
          LIMIT 1
        `)
      );
    }
    return this.statements.get('getLinkBySlug')!;
  }
}

// 使用
const stmt = preparedStatements.getLinkBySlug();
const link = await stmt.bind(domain, slug).first();
```

### 1.3 减少重定向延迟

**优化策略**：

```typescript
// apps/worker/src/index.ts
export async function handleRedirect(c: Context) {
  const start = Date.now();
  
  // 1. 并行查询 KV 和 D1（降级策略）
  const [cached, dbResult] = await Promise.allSettled([
    getCachedLink(c.env.KV, domain, slug),
    getLinkForRedirect(c.env.DB, domain, slug)
  ]);
  
  let link: RedirectLink | null = null;
  
  // 2. 优先使用 D1 结果
  if (dbResult.status === 'fulfilled' && dbResult.value) {
    link = dbResult.value;
    
    // 异步更新缓存
    c.executionCtx.waitUntil(
      setCachedLink(c.env.KV, domain, slug, link)
    );
  } 
  // 3. D1 失败时降级到缓存
  else if (cached.status === 'fulfilled' && cached.value) {
    link = cached.value;
    console.warn('D1 unavailable, using cached link');
  }
  
  if (!link) {
    return htmlNotFound();
  }
  
  // 4. 立即重定向
  const response = Response.redirect(link.long_url, link.redirect_type);
  
  // 5. 异步记录访问
  c.executionCtx.waitUntil(
    recordVisit(c.env, link.id, extractVisitData(c))
  );
  
  // 记录性能指标
  const duration = Date.now() - start;
  console.log(`Redirect time: ${duration}ms`);
  
  return response;
}
```

---

## 2. Admin 性能优化

### 2.1 分页优化

**当前实现**：

```typescript
// Offset 分页
SELECT * FROM links ORDER BY created_at DESC LIMIT 20 OFFSET 40
```

**优化：游标分页**

```typescript
// apps/worker/src/db/index.ts
export async function listLinksWithCursor(
  db: D1Database,
  cursor?: string,
  limit = 20
): Promise<{ links: Link[], nextCursor?: string }> {
  let query = `
    SELECT * FROM links 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (cursor) {
    query += ` AND id < ?`;
    params.push(cursor);
  }
  
  query += ` ORDER BY id DESC LIMIT ?`;
  params.push(limit + 1);
  
  const results = await db.prepare(query)
    .bind(...params)
    .all();
  
  const links = results.results.slice(0, limit);
  const hasMore = results.results.length > limit;
  const nextCursor = hasMore ? links[links.length - 1].id : undefined;
  
  return { links, nextCursor };
}
```

### 2.2 懒加载优化

**当前问题**：
- 重路由冷启动可能需要 15 秒

**优化方案**：

```typescript
// apps/admin/src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { PageLoading } from './components/ui/PageLoading';

// 懒加载路由组件
const Analytics = lazy(() => import('./pages/Analytics'));
const Links = lazy(() => import('./pages/Links'));
const Settings = lazy(() => import('./pages/Settings'));

// 预加载关键路由
function usePreloadRoutes(authenticated: boolean) {
  useEffect(() => {
    if (!authenticated) return;
    
    // 用户认证后，预加载常用页面
    const preload = async () => {
      await Promise.all([
        import('./pages/Analytics'),
        import('./pages/Links')
      ]);
    };
    
    // 延迟 1 秒后预加载，避免阻塞初始渲染
    const timer = setTimeout(preload, 1000);
    return () => clearTimeout(timer);
  }, [authenticated]);
}

function App() {
  const { authenticated } = useAuth();
  usePreloadRoutes(authenticated);
  
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/links" element={<Links />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

### 2.3 大列表渲染优化

**虚拟滚动**：

```bash
npm install react-window --workspace=apps/admin
```

```typescript
// apps/admin/src/components/links/VirtualLinkList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualLinkListProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
}

export function VirtualLinkList({ links, onEdit, onDelete }: VirtualLinkListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = links[index];
    
    return (
      <div style={style} className="border-b">
        <LinkCard link={link} onEdit={onEdit} onDelete={onDelete} />
      </div>
    );
  };
  
  return (
    <List
      height={600}
      itemCount={links.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### 2.4 API 响应缓存

**浏览器缓存策略**：

```typescript
// apps/worker/src/routes/settings.ts
export async function getSettings(c: Context) {
  const settings = await loadSettings(c.env.DB);
  
  return c.json(
    { success: true, data: settings },
    200,
    {
      'Cache-Control': 'private, max-age=300', // 5 分钟
      'ETag': generateETag(settings)
    }
  );
}

// apps/admin/src/api/client.ts
export async function apiGet<T>(url: string): Promise<T> {
  const cachedResponse = sessionStorage.getItem(url);
  if (cachedResponse) {
    const { data, timestamp } = JSON.parse(cachedResponse);
    if (Date.now() - timestamp < 60000) { // 1 分钟内
      return data;
    }
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  sessionStorage.setItem(url, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

### 2.5 代码分割优化

**Vite 配置优化**：

```typescript
// apps/admin/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离第三方库
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', '@headlessui/react'],
          'vendor-utils': ['date-fns', 'qrcode']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true
      }
    }
  }
});
```

---

## 3. 数据库优化

### 3.1 批量操作

**批量插入访问记录**：

```typescript
// apps/worker/src/analytics/batch.ts
export class VisitBatcher {
  private batch: Visit[] = [];
  private readonly maxBatchSize = 100;
  private readonly maxWaitTime = 5000; // 5 秒
  private timer?: number;
  
  constructor(private env: Env) {}
  
  add(visit: Visit) {
    this.batch.push(visit);
    
    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    const visits = this.batch.splice(0, this.batch.length);
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    
    const stmt = this.env.DB.prepare(`
      INSERT INTO visits (
        link_id, timestamp, country, city, device, browser, os, referer, ip_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const batch = visits.map(v => 
      stmt.bind(
        v.link_id, v.timestamp, v.country, v.city,
        v.device, v.browser, v.os, v.referer, v.ip_hash
      )
    );
    
    await this.env.DB.batch(batch);
  }
}
```

### 3.2 查询优化

**使用 EXPLAIN 分析查询**：

```sql
-- 查看查询计划
EXPLAIN QUERY PLAN 
SELECT * FROM links 
WHERE domain = 'go.example.com' AND slug = 'test';

-- 应该看到：SEARCH links USING INDEX idx_links_domain_slug
```

**优化复杂查询**：

```typescript
// ❌ 避免：N+1 查询
for (const link of links) {
  const stats = await getVisitStats(link.id);
  link.stats = stats;
}

// ✅ 优化：批量查询
const linkIds = links.map(l => l.id);
const stats = await getVisitStatsBatch(linkIds);
const statsMap = new Map(stats.map(s => [s.link_id, s]));
for (const link of links) {
  link.stats = statsMap.get(link.id);
}
```

### 3.3 数据归档

**归档旧访问记录**：

```sql
-- migrations/0004_visits_archive.sql

-- 创建归档表
CREATE TABLE visits_archive (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  country TEXT,
  device TEXT,
  archived_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX idx_visits_archive_link_timestamp 
ON visits_archive(link_id, timestamp);
```

```typescript
// apps/worker/src/maintenance/archive.ts
export async function archiveOldVisits(env: Env, olderThanDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  // 1. 复制到归档表
  await env.DB.prepare(`
    INSERT INTO visits_archive (id, link_id, timestamp, country, device)
    SELECT id, link_id, timestamp, country, device
    FROM visits
    WHERE timestamp < ?
  `).bind(cutoffDate.toISOString()).run();
  
  // 2. 删除旧记录
  await env.DB.prepare(`
    DELETE FROM visits WHERE timestamp < ?
  `).bind(cutoffDate.toISOString()).run();
}
```

---

## 4. 监控和指标

### 4.1 性能监控

**Worker 性能指标**：

```typescript
// apps/worker/src/utils/metrics.ts
export interface Metrics {
  redirectTime: number;
  kvHit: boolean;
  d1QueryTime: number;
  queueLatency?: number;
}

export function recordMetrics(metrics: Metrics) {
  console.log(JSON.stringify({
    timestamp: Date.now(),
    type: 'metrics',
    ...metrics
  }));
}

// 使用
export async function handleRedirect(c: Context) {
  const start = Date.now();
  
  const kvStart = Date.now();
  const cached = await getCachedLink(c.env.KV, domain, slug);
  const kvTime = Date.now() - kvStart;
  
  const d1Start = Date.now();
  const link = await getLinkForRedirect(c.env.DB, domain, slug);
  const d1Time = Date.now() - d1Start;
  
  const redirectTime = Date.now() - start;
  
  recordMetrics({
    redirectTime,
    kvHit: !!cached,
    d1QueryTime: d1Time
  });
  
  // ... redirect
}
```

### 4.2 性能告警

**设置告警阈值**：

```typescript
// apps/worker/src/utils/alerts.ts
export function checkPerformanceThresholds(metrics: Metrics) {
  const alerts: string[] = [];
  
  if (metrics.redirectTime > 500) {
    alerts.push(`Critical: Redirect time ${metrics.redirectTime}ms > 500ms`);
  } else if (metrics.redirectTime > 200) {
    alerts.push(`Warning: Redirect time ${metrics.redirectTime}ms > 200ms`);
  }
  
  if (metrics.d1QueryTime > 300) {
    alerts.push(`Critical: D1 query time ${metrics.d1QueryTime}ms > 300ms`);
  }
  
  if (alerts.length > 0) {
    // 发送到监控系统或 Webhook
    sendAlerts(alerts);
  }
}
```

### 4.3 Admin 性能监控

**使用 Web Vitals**：

```bash
npm install web-vitals --workspace=apps/admin
```

```typescript
// apps/admin/src/utils/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function initVitals() {
  onCLS(console.log);
  onFID(console.log);
  onFCP(console.log);
  onLCP(console.log);
  onTTFB(console.log);
}

// apps/admin/src/main.tsx
import { initVitals } from './utils/vitals';

if (import.meta.env.PROD) {
  initVitals();
}
```

---

## 5. 最佳实践检查清单

### Worker 性能

- [ ] 热门链接已缓存到 KV
- [ ] 使用智能 TTL 策略
- [ ] D1 查询有适当索引
- [ ] 只查询需要的字段
- [ ] 异步操作使用 `ctx.waitUntil()`
- [ ] 批量操作减少 D1 写入
- [ ] 错误处理不阻塞重定向

### Admin 性能

- [ ] 使用代码分割
- [ ] 懒加载非关键路由
- [ ] 虚拟滚动大列表
- [ ] API 响应缓存
- [ ] 图片懒加载
- [ ] 防抖/节流频繁操作
- [ ] 生产构建移除 console

### 数据库性能

- [ ] 关键查询有索引
- [ ] 避免 N+1 查询
- [ ] 使用批量操作
- [ ] 定期归档旧数据
- [ ] 分析慢查询
- [ ] 监控数据库大小

### 监控

- [ ] 记录关键性能指标
- [ ] 设置告警阈值
- [ ] 定期审查日志
- [ ] 跟踪性能趋势

---

## 6. 性能测试

### 负载测试

```bash
# 使用 Apache Bench
ab -n 1000 -c 10 https://go.example.com/test-slug

# 使用 wrk
wrk -t4 -c100 -d30s https://go.example.com/test-slug
```

### 基准测试

```typescript
// tests/performance/redirect-bench.test.ts
import { describe, bench } from 'vitest';

describe('Redirect Performance', () => {
  bench('KV cache hit', async () => {
    const response = await fetch('http://localhost:8787/hot-slug');
    expect(response.status).toBe(302);
  });
  
  bench('D1 query (cold)', async () => {
    await clearCache('cold-slug');
    const response = await fetch('http://localhost:8787/cold-slug');
    expect(response.status).toBe(302);
  });
});
```

---

## 7. 常见性能问题

### 问题 1：重定向慢

**症状**：重定向时间 > 500ms

**排查**：
1. 检查 KV 命中率
2. 分析 D1 查询时间
3. 查看 Worker 日志

**解决**：
- 预热热门链接
- 添加缺失索引
- 优化查询

### 问题 2：Admin 加载慢

**症状**：首屏加载 > 5s

**排查**：
1. 浏览器 Network 面板
2. Lighthouse 分析
3. 检查 bundle 大小

**解决**：
- 代码分割
- 压缩资源
- CDN 加速

### 问题 3：数据库查询慢

**症状**：API 请求超时

**排查**：
1. 使用 EXPLAIN 分析查询
2. 检查索引使用情况
3. 查看数据库大小

**解决**：
- 添加索引
- 优化查询
- 归档旧数据

---

## 参考资源

- [Cloudflare Workers Performance](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 Best Practices](https://developers.cloudflare.com/d1/platform/limits/)
- [KV Performance](https://developers.cloudflare.com/kv/platform/limits/)
- [Web Vitals](https://web.dev/vitals/)
