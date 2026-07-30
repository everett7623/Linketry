# Linketry 优化计划

基于 v0.29.20 代码库分析，以下是优化建议和改进计划。

最后更新：2026-07-30

---

## 📋 优先级分类

- 🔴 **高优先级** — 影响用户体验或开发效率
- 🟡 **中优先级** — 改进但不紧急
- 🟢 **低优先级** — 可选增强

---

## 1️⃣ 文档优化

### 🔴 高优先级：更新过时信息

#### A. Node.js 版本要求统一

**当前问题**：
- `package.json` 已要求 Node.js 24
- 但 `README.md` 和 `DEVELOPMENT_GUIDE.md` 仍写 20+

**需要更新的文件**：
```markdown
- README.md:115 → "Node.js 24.x"
- DEVELOPMENT_GUIDE.md:9 → "Node.js 24"
- docs/SELF_HOSTING.md:26 → "Node.js 24 推荐"
```

#### B. KNOWN_ISSUES.md 清理

**当前问题**：
- 第一个问题已在 v0.9.13 修复，现在是 v0.29.20
- 应该移到历史记录或归档

**建议**：
```markdown
## 历史问题（已修复）

### 1. 大体积 Shlink 导入确认超时
- **修复版本**：v0.9.13
- **当前版本**：v0.29.20
- **状态**：✅ 已解决并验证
```

---

### 🟡 中优先级：新增文档

#### A. docs/TROUBLESHOOTING.md

```markdown
# 故障排查指南

## 开发环境问题

### 1. Worker 启动失败
**症状**：`npm run dev --workspace=apps/worker` 报错

**检查清单**：
- [ ] `.dev.vars` 是否存在且包含 `LINKETRY_ADMIN_TOKEN`
- [ ] `wrangler.toml` 是否从 example 复制并配置
- [ ] 本地 D1 迁移是否已运行
- [ ] Node.js 版本是否为 24.x

### 2. Admin 无法连接 Worker API
**症状**：登录失败，Network Error

**检查清单**：
- [ ] Worker 是否在 http://localhost:8787 运行
- [ ] vite.config.ts 代理配置是否正确
- [ ] CORS 是否正确配置

## 部署问题

### 1. Cloudflare Quick Deploy 失败
**症状**：D1/KV 资源创建失败

**解决方案**：
- 检查 Cloudflare 账户权限
- 确认账户 ID 正确
- 查看 Wrangler 日志：`wrangler tail`

### 2. 迁移失败
**症状**：`db:migrate:remote` 报错

**解决方案**：
- 运行 `npm run deploy:preflight -- --track upgrade`
- 检查现有迁移状态：`wrangler d1 migrations list DB`
- 查看迁移摘要：`npm run deploy:migration-digest`

## 性能问题

### 1. 重定向慢
**可能原因**：
- KV 缓存未命中
- D1 查询慢
- 网络延迟

**排查步骤**：
1. 检查 KV 缓存命中率
2. 查看 D1 查询日志
3. 使用 `wrangler tail` 监控 Worker 响应时间

### 2. Admin 加载慢
**可能原因**：
- 懒加载路由冷启动
- API 响应慢
- 大数据量渲染

**优化建议**：
- 启用浏览器缓存
- 使用分页限制
- 检查 API 响应时间
```

#### B. docs/CONTRIBUTING.md

```markdown
# 贡献指南

## 开发流程

### 1. Fork 和 Clone
```bash
git clone https://github.com/YOUR_USERNAME/Linketry.git
cd Linketry
npm install
```

### 2. 创建功能分支
```bash
git checkout -b feat/your-feature-name
```

### 3. 开发和测试
```bash
# 运行 Worker 和 Admin
npm run dev --workspace=apps/worker
npm run dev --workspace=apps/admin

# 运行测试
npm run test:worker
npm run test:admin
npm run test:deployment
```

### 4. Commit 规范
```
<type>: <subject>

type 可选值：
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- chore: 构建/工具链更新
- refactor: 重构
- test: 测试更新
```

**示例**：
```
feat: 添加批量删除链接功能
fix: 修复 KV 缓存过期逻辑
docs: 更新自托管部署指南
```

**禁止**：
- ❌ 不要添加 `Co-Authored-By` 或 AI 署名
- ❌ 不要在 commit 中包含密钥

### 5. 提交 Pull Request

**PR 标题**：
- 简洁明了（< 70 字符）
- 使用简体中文
- 示例：`feat: 添加健康检查端点`

**PR 描述**：
```markdown
## 变更说明
简要描述变更内容

## 测试情况
- [ ] Worker 测试通过
- [ ] Admin 测试通过
- [ ] 浏览器测试通过
- [ ] 部署测试通过

## 影响范围
- [ ] 重定向逻辑
- [ ] API 行为
- [ ] Admin UI
- [ ] 数据库模式
- [ ] 配置文件

## 截图（如有 UI 变更）
```

## 代码规范

### Backend (Worker)

```typescript
// ✅ 好的做法
export async function getLink(env: Env, id: string): Promise<Link | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM links WHERE id = ?'
  ).bind(id).first();
  return result || null;
}

// ❌ 避免
// 不要在路由处理器中内联 SQL
router.get('/links/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT ...'); // ❌
});
```

### Frontend (Admin)

```typescript
// ✅ 好的做法
import { listLinks } from '../api/links';

const links = await listLinks({ page: 1, pageSize: 20 });

// ❌ 避免
// 不要直接 fetch
const response = await fetch('/api/v1/links'); // ❌
```

## 发布规范

每次变更必须同步更新：

1. **版本号**（语义化版本）
   - `package.json`
   - `packages/shared/src/version.ts`
   - `apps/*/package.json`

2. **CHANGELOG.md**
   - 用户可见的变更
   - 修复说明
   - 破坏性变更

3. **文档**
   - `PROGRESS.md` — 功能状态
   - `TASKS.md` — 任务状态
   - `README.md` — 如有必要

4. **测试**
   - 新功能必须有测试覆盖
   - 所有测试必须通过

## 审查标准

PR 会从以下方面审查：

- ✅ 遵循黄金规则（重定向稳定性优先）
- ✅ 代码风格一致
- ✅ 测试覆盖充分
- ✅ 文档更新完整
- ✅ 无明显性能问题
- ✅ 无安全风险
- ✅ Commit message 规范
```

#### C. docs/PERFORMANCE.md

```markdown
# 性能优化指南

## 重定向性能

### 1. KV 缓存策略

**当前策略**：
- TTL: 24 小时
- 键格式: `linketry:slug:<domain>:<slug>`
- 命中后仍重新验证 D1 状态

**优化建议**：
```typescript
// 优化：批量预热热门链接
export async function warmupPopularLinks(env: Env) {
  const popular = await env.DB.prepare(`
    SELECT domain, slug, long_url 
    FROM links 
    WHERE click_count > 100 
    AND status = 'active'
  `).all();
  
  for (const link of popular.results) {
    await setCachedLink(env.KV, link.domain, link.slug, link);
  }
}
```

### 2. D1 查询优化

**当前查询**：
```sql
SELECT * FROM links WHERE domain = ? AND slug = ?
```

**优化建议**：
- 确保 `(domain, slug)` 有复合索引
- 避免 `SELECT *`，只查询需要的字段
- 使用批量查询减少往返

```sql
-- 添加复合索引
CREATE INDEX IF NOT EXISTS idx_links_domain_slug 
ON links(domain, slug) WHERE status = 'active';

-- 优化查询
SELECT id, long_url, redirect_type, status, expires_at, max_clicks, click_count
FROM links 
WHERE domain = ? AND slug = ?
AND status = 'active'
LIMIT 1;
```

### 3. Worker 响应时间

**目标**：
- 缓存命中: < 50ms
- 缓存未命中: < 200ms

**监控**：
```typescript
const start = Date.now();
// ... redirect logic
const duration = Date.now() - start;
console.log(`Redirect time: ${duration}ms`);
```

## Admin 性能

### 1. 分页优化

**当前**：
- 默认 20 条/页
- 前端分页

**优化建议**：
```typescript
// 使用游标分页替代 offset
export async function listLinksWithCursor(
  env: Env,
  cursor?: string,
  limit = 20
) {
  const query = cursor
    ? `SELECT * FROM links WHERE id < ? ORDER BY id DESC LIMIT ?`
    : `SELECT * FROM links ORDER BY id DESC LIMIT ?`;
  
  // ...
}
```

### 2. 懒加载优化

**当前问题**：
- 重路由冷启动可能需要 15 秒

**已有优化**：
- v0.29.19 添加了 15 秒首次渲染容忍度

**进一步优化**：
```typescript
// 预加载关键路由
import { lazy, Suspense } from 'react';

const Analytics = lazy(() => import('./pages/Analytics'));

// 在 App.tsx 中提前预加载
useEffect(() => {
  if (authenticated) {
    import('./pages/Analytics');
    import('./pages/Links');
  }
}, [authenticated]);
```

### 3. 数据渲染优化

**大列表优化**：
```typescript
// 使用虚拟滚动
import { VirtualList } from 'react-window';

<VirtualList
  height={600}
  itemCount={links.length}
  itemSize={80}
>
  {({ index, style }) => (
    <LinkCard link={links[index]} style={style} />
  )}
</VirtualList>
```

## 数据库优化

### 1. 访问统计优化

**当前**：
- 异步写入通过 Queue 或 `ctx.waitUntil()`
- 不阻塞重定向

**进一步优化**：
```typescript
// 批量插入减少 D1 写入次数
export async function batchInsertVisits(
  env: Env,
  visits: Visit[]
) {
  const stmt = env.DB.prepare(`
    INSERT INTO visits (link_id, timestamp, country, device, ...)
    VALUES (?, ?, ?, ?, ...)
  `);
  
  const batch = visits.map(v => stmt.bind(
    v.link_id, v.timestamp, v.country, v.device
  ));
  
  await env.DB.batch(batch);
}
```

### 2. 分析查询优化

**优化索引**：
```sql
-- 按时间范围查询
CREATE INDEX idx_visits_link_timestamp 
ON visits(link_id, timestamp);

-- 按国家/设备分析
CREATE INDEX idx_visits_dimensions 
ON visits(link_id, country, device, timestamp);
```

## 缓存策略

### 1. Admin 静态资源

**优化建议**：
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'ui': ['lucide-react', '@headlessui/react']
        }
      }
    }
  }
});
```

### 2. API 响应缓存

**优化建议**：
```typescript
// 缓存不常变化的数据
export async function getSettings(env: Env): Promise<Settings> {
  const cached = await env.KV.get('settings:cache');
  if (cached) return JSON.parse(cached);
  
  const settings = await loadSettingsFromD1(env);
  await env.KV.put('settings:cache', JSON.stringify(settings), {
    expirationTtl: 300 // 5 分钟
  });
  
  return settings;
}
```

## 监控指标

### 关键指标

```typescript
// Worker 性能指标
interface Metrics {
  redirectTime: number;      // 重定向耗时
  kvHitRate: number;         // KV 命中率
  d1QueryTime: number;       // D1 查询耗时
  queueLatency: number;      // Queue 延迟
}

// 收集指标
export function recordMetrics(metrics: Metrics) {
  console.log(JSON.stringify({
    timestamp: Date.now(),
    ...metrics
  }));
}
```

### 告警阈值

```yaml
redirect_time:
  warning: 200ms
  critical: 500ms

kv_hit_rate:
  warning: 80%
  critical: 60%

d1_query_time:
  warning: 100ms
  critical: 300ms
```
```

---

## 2️⃣ 代码优化

### 🔴 高优先级：代码质量

#### A. TypeScript 严格模式

**当前**：
- 部分文件可能有 `any` 类型
- 类型推断不完整

**优化**：
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### B. 错误处理标准化

**优化**：
```typescript
// apps/worker/src/utils/errors.ts
export class LinketryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'LinketryError';
  }
}

export class NotFoundError extends LinketryError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

// 使用
throw new NotFoundError('Link not found');
```

---

## 3️⃣ UI/UX 优化

### 🔴 高优先级：视觉体验

#### A. 加载状态改进

**当前问题**：
- 部分页面加载状态不明显
- 空状态缺少引导

**优化建议**：
```typescript
// 统一加载组件
export function LoadingState({ message = '加载中...' }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-3 text-slate-600">{message}</span>
    </div>
  );
}

// 空状态组件
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

#### B. 响应式优化

**检查清单**：
- [ ] 所有表格在移动端可切换到卡片视图
- [ ] 弹窗在小屏幕下全屏显示
- [ ] 表单在移动端单列布局
- [ ] 导航栏在移动端折叠

#### C. 无障碍优化

**当前状态**：
- 已有基本的 ARIA 标签
- 键盘导航支持

**进一步优化**：
```typescript
// 添加焦点管理
export function Modal({ open, onClose, children }) {
  const previousFocus = useRef<HTMLElement>();
  
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      // 焦点移到模态框
    }
    return () => {
      previousFocus.current?.focus();
    };
  }, [open]);
  
  // ...
}
```

---

## 4️⃣ 测试优化

### 🟡 中优先级：测试覆盖

#### A. E2E 测试增强

**当前覆盖**：
- 25 个 Admin 浏览器测试
- 基本流程覆盖

**建议新增**：
```typescript
// tests/e2e/critical-path.spec.ts
test('完整短链接生命周期', async ({ page }) => {
  // 1. 登录
  await login(page);
  
  // 2. 创建链接
  await createLink(page, { slug: 'test', url: 'https://example.com' });
  
  // 3. 验证重定向
  await verifyRedirect(page, 'test', 'https://example.com');
  
  // 4. 查看分析
  await viewAnalytics(page, 'test');
  
  // 5. 编辑链接
  await editLink(page, 'test', { url: 'https://new.com' });
  
  // 6. 删除链接
  await deleteLink(page, 'test');
});
```

#### B. 性能测试

```typescript
// tests/performance/redirect-bench.ts
import { bench } from 'vitest';

bench('KV 缓存命中重定向', async () => {
  const response = await fetch('http://localhost:8787/test-slug');
  expect(response.status).toBe(302);
});

bench('D1 查询重定向', async () => {
  // 清除 KV 缓存
  await clearCache('test-slug');
  const response = await fetch('http://localhost:8787/test-slug');
  expect(response.status).toBe(302);
});
```

---

## 5️⃣ 安全优化

### 🔴 高优先级：安全加固

#### A. 输入验证增强

**当前**：
- 基本的 slug/URL 验证

**增强**：
```typescript
// packages/shared/src/validators/index.ts
export const linkSchema = z.object({
  slug: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .refine(slug => !RESERVED_SLUGS.includes(slug), {
      message: '该 slug 为保留路径'
    }),
  long_url: z.string()
    .url()
    .refine(url => {
      const parsed = new URL(url);
      return !['javascript:', 'data:', 'file:'].includes(parsed.protocol);
    }, {
      message: '不允许的 URL 协议'
    })
    .refine(url => {
      const parsed = new URL(url);
      return !isPrivateIP(parsed.hostname);
    }, {
      message: '不允许指向内网地址'
    })
});
```

#### B. Rate Limiting

**建议**：
```typescript
// apps/worker/src/middleware/rateLimit.ts
export async function rateLimit(
  env: Env,
  ip: string,
  limit = 100,
  window = 60
): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const current = await env.KV.get(key);
  
  if (current && parseInt(current) >= limit) {
    return false;
  }
  
  const count = current ? parseInt(current) + 1 : 1;
  await env.KV.put(key, count.toString(), { expirationTtl: window });
  
  return true;
}
```

---

## 📅 实施计划

### Phase 1: 文档更新（1-2 天）
- [ ] 更新 Node.js 版本要求
- [ ] 清理 KNOWN_ISSUES.md
- [ ] 创建 TROUBLESHOOTING.md
- [ ] 创建 CONTRIBUTING.md
- [ ] 创建 PERFORMANCE.md

### Phase 2: 代码优化（3-5 天）
- [ ] TypeScript 严格模式
- [ ] 错误处理标准化
- [ ] 性能优化实施
- [ ] 安全加固

### Phase 3: UI/UX 优化（2-3 天）
- [ ] 加载状态改进
- [ ] 空状态优化
- [ ] 响应式检查
- [ ] 无障碍优化

### Phase 4: 测试增强（2-3 天）
- [ ] E2E 测试补充
- [ ] 性能测试
- [ ] 安全测试

---

## 📊 成功指标

- ✅ 所有文档版本号一致
- ✅ 测试覆盖率 > 80%
- ✅ 重定向响应时间 < 100ms (P95)
- ✅ Admin 首屏加载 < 2s
- ✅ Lighthouse 分数 > 90
- ✅ 无高危安全漏洞
- ✅ 无障碍评分 AA 级

---

## 💡 后续改进方向

1. **监控和告警系统**
   - Cloudflare Analytics Workers 集成
   - 自定义指标收集
   - Slack/Email 告警

2. **自动化部署**
   - 自动化版本发布
   - 回滚机制
   - 灰度发布

3. **开发体验**
   - Storybook 组件文档
   - API Mock 服务
   - 本地 Demo 数据生成

4. **产品功能**（参考 ROADMAP.md V7-V10）
   - 目标监控告警
   - 批量 UTM 操作
   - 公开统计页面
   - OpenGraph 预览
   - 多用户协作
