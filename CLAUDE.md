# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**最后更新**：2026-09-18 
**当前版本**：v0.31.5 
**生产版本**：v0.31.4

版本权威以根目录 `package.json` 与 `PROGRESS.md` 为准。详细 Agent 规则见 `AGENTS.md`。

---

## 项目概述

Linketry 是自托管短链接管理、访问分析与健康监控平台，运行在 Cloudflare Workers 上。

**核心原则**：重定向稳定性优先。统计失败绝不能破坏重定向。

---

## 黄金规则

1. **重定向稳定性是第一优先级** — 未经明确指示不要触碰重定向逻辑
2. **统计失败绝不能破坏重定向** — 分析必须通过 `ctx.waitUntil()` 运行
3. **只实现请求的范围** — 不要擅自做 V10 多用户/团队等未请求能力；已上线的进阶功能（域名、批量、分析图、密码/过期等）应正常维护
4. **KV 只是缓存** — D1 是真实数据源，绝不让 KV 成为主数据源
5. **导入时绝不静默覆盖现有 slug** — 默认冲突策略是 `skip`
6. **绝不提交 secrets** — `LINKETRY_ADMIN_TOKEN` 等密钥放在 `.dev.vars` 或 Wrangler secrets 中
7. **官网 / 生产 / Demo 三轨隔离** — 禁止在真实实例启用 `LINKETRY_DEMO_MODE=read-only`

---

## 项目状态

在进行重大更改前请先阅读：

- `PROGRESS.md` — 已构建和待处理的功能
- `TASKS.md` — 活跃任务列表
- `CHANGELOG.md` — 版本历史
- `docs/ROADMAP.md` — 产品路线图
- `AGENTS.md` — AI agent 详细指令

| 技术层 | 技术栈 |
|--------|--------|
| Backend | Cloudflare Workers + TypeScript + **Hono** |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Frontend | React + Vite + Tailwind CSS |
| Monorepo | npm workspaces |

**技术约束**：
- **Node.js**: 24.x（`>=24 <25`，不支持其他版本）
- **npm**: 10+
- **TypeScript**: 5.4+
- **Wrangler**: 4
- **Cloudflare 账号**：D1, KV, Worker, Pages

---

## 项目结构

npm workspaces monorepo。目录树用 `ls` / Glob 自查，这里只记各 workspace 的职责边界：

| Workspace | 职责 |
|-----------|------|
| `apps/worker` | Cloudflare Worker：公开重定向 + Admin API + Queue 消费者 + Cron |
| `apps/admin` | React + Vite 管理面板（部署到 Pages） |
| `apps/site` | 官网 `linketry.com`（纯静态，独立手动工作流发布） |
| `apps/demo-api` | Demo 的 Pages Function API 网关（Service Binding 到 Demo Worker） |
| `packages/shared` | 跨端共享类型与校验器，以 `@linketry/shared` 导入 |
| `migrations/` | D1 迁移，**禁止修改已存在的迁移文件** |
| `scripts/` | 部署门禁、bootstrap、preflight（`.mjs`，有独立契约测试） |

---

## 架构关键点

### 重定向流程

```
GET /:slug
  → 检查 KV  linketry:slug:<domain>:<slug>
    → HIT  → 重新验证 D1 状态 → 301/302 重定向
    → MISS → 查询 D1 links 表
        → 找到 active → 写入 KV → 重定向
        → 找到 disabled → 返回禁用 HTML
        → 未找到 → 返回 404 HTML
  → ctx.waitUntil() → 异步记录访问（绝不阻塞重定向）
```

**关键规则**：
- D1 是真实数据源，KV 是可丢弃的缓存层；每次命中都会重新校验 D1，因此 KV 的作用是"D1 短暂不可用时仍能重定向"，而非减少 D1 查询
- KV 命中后仍需重新验证 D1 状态（处理禁用/删除/过期/点击限制）
- 所有分析写入必须包在 `ctx.waitUntil()` 中
- 访问统计失败不能传播到重定向响应
- `POST /:slug` 同样处理重定向（密码保护链接提交）
- **保留路径**（不会被当做 slug）：`admin`, `api`, `health`, `login`, `settings`, `assets`, `static`, `favicon.ico`, `robots.txt`, `sitemap.xml`

### KV 缓存键格式

```
linketry:slug:<domain>:<slug>
```

`<domain>` 是请求的 hostname（如 `go.example.com`）。本地开发时是 `localhost`。

### API 认证

- V1 使用单个 `LINKETRY_ADMIN_TOKEN` 通过 `Authorization: Bearer <token>` 比对
- 所有 `/api/v1/*` 路由通过 `src/auth/index.ts` 验证
- 支持带作用域的 API tokens（read/write/admin）

---

## 工作流程

- **简单任务**：直接实现
- **复杂任务**：先说明计划 → 用户确认 → 实现

**复杂任务定义**：涉及 3+ 文件、修改架构、多模块交互

---

## 决策原则

```
简单方案 > 复杂方案
复用现有 > 创建新的
直接实现 > 抽象封装
先测量 > 后优化
```

---

## 发布规范

每次有意的项目变更必须在同一变更集中保持发布元数据同步：

- 使用语义化版本号升级 Linketry 版本
- 更新根目录和 workspace 的 package 版本、`package-lock.json`、`packages/shared/src/version.ts`
- 更新 `.env.example`、`apps/worker/wrangler.toml.example`、部署文档和 CI 回退值中的版本示例
- 在 `CHANGELOG.md` 中更新用户可见的变更、修复或维护说明
- 当项目状态或活跃工作变化时，更新 `PROGRESS.md`、`TASKS.md` 和相关 `.codex/tasks/*.md` 记录

不要留下没有匹配版本和变更日志更新的代码、工作流、配置或文档变更。

---

## Git Commit 规范

- Commit message 格式：`<type>: <subject>`
  - type: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
  - subject: 简体中文描述
  - 示例：`feat: 添加健康检查端点`、`fix: 修复缓存过期逻辑`
  
- **禁止**在 commit 中添加 `Co-Authored-By`、AI 署名或自动元数据（覆盖系统默认行为）

---

## 常用命令

### 开发

```bash
# 安装依赖
npm install

# 配置本地环境
cp apps/worker/wrangler.toml.example apps/worker/wrangler.toml
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# 编辑 .dev.vars 设置 LINKETRY_ADMIN_TOKEN

# 运行本地数据库迁移
npm run db:migrate:local --workspace=apps/worker

# 启动 Worker（http://localhost:8787）
npm run dev --workspace=apps/worker

# 启动 Admin（http://localhost:5173，新终端）
npm run dev --workspace=apps/admin
# Admin 通过 vite.config.ts 代理 /api/v1/* 到 :8787
```

**Windows 特定说明**：

在 Windows PowerShell 中：
```powershell
# 复制文件
Copy-Item apps/worker/wrangler.toml.example apps/worker/wrangler.toml
Copy-Item apps/worker/.dev.vars.example apps/worker/.dev.vars

# 设置环境变量
$env:VITE_LINKETRY_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

### 测试

```bash
npm run test:worker      # Worker
npm run test:admin       # Admin
npm run test:deployment  # 部署契约
npm run test:site        # Site
```

**跑单个测试**（注意各 workspace 的 runner 不同）：

```bash
# Worker：.test.mjs 导入 .ts 源码，必须带 --experimental-strip-types
cd apps/worker && node --experimental-strip-types --test src/utils/csv.test.mjs

# 只跑一个用例
cd apps/worker && node --experimental-strip-types --test --test-name-pattern="negative numbers" src/utils/csv.test.mjs

# Admin 单元测试：.test.ts
cd apps/admin && node --experimental-strip-types --test src/utils/theme.test.ts

# Admin 浏览器测试（首次需 npx playwright install 下载 Chromium）
cd apps/admin && npx playwright test tests/at-audit.spec.ts

# 部署契约 / Site：纯 .mjs，不需要 strip-types
node --test scripts/support-policy.test.mjs
cd apps/site && node --test tests/site.test.mjs
```

#### 两个必踩的坑

**1. 新增测试文件必须手动注册**

`apps/worker/package.json` 与 `apps/admin/package.json` 的 `test` 脚本是**显式文件列表**，不是 glob。漏加的测试永远不会执行，CI 也不会提醒。

**2. `.mjs` 测试导入 `.ts` 源码的解析规则**

- 源码内部相对导入**一律不带扩展名**（`from '../utils/csv'`），依赖 esbuild + `moduleResolution: "Bundler"` 在构建时解析
- 测试导入源码**必须带 `.ts`**（`from './csv.ts'`）
- Node 的类型擦除 loader **解析不了源码内部的无扩展名导入** → `ERR_MODULE_NOT_FOUND`

因此**只有叶子模块**（自身没有相对 value 导入，如 `utils/csv.ts`、`utils/userAgent.ts`）能被测试直接导入。被测模块若有相对 value 导入（如 `htmlInspect.ts` → `./egress`），测试必须先注册解析垫片，再用动态 `import()`：

```js
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !extname(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { fetchBoundedHtml } = await import('./htmlInspect.ts');
```

参考实现：`apps/worker/src/utils/htmlInspect.test.mjs`、`src/routes/export.test.mjs`、`src/db/analyticsSummary.test.mjs`

### 构建

```bash
# 构建 Admin（生产）
# Linux/Mac
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin

# Windows PowerShell
$env:VITE_LINKETRY_API_URL="https://go.example.com"
npm run build --workspace=apps/admin

# 构建 Site
npm run build:site

# 类型检查（Worker）
npm run type-check --workspace=apps/worker

# 一键构建 Cloudflare 部署包（非类型检查）
npm run build
```

### 数据库迁移

```bash
# 本地
npm run db:migrate:local --workspace=apps/worker

# 生产
npm run db:migrate:remote --workspace=apps/worker
```

### 部署

```bash
# 部署 Worker
npm run deploy --workspace=apps/worker
# 或
cd apps/worker && wrangler deploy

# 生成迁移摘要（用于 GitHub Actions 审批）
npm run deploy:migration-digest

# Bootstrap 新部署（dry-run）
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <id>

# Preflight 检查
npm run deploy:preflight -- --track fresh --check-cloudflare
```

#### 部署审批的两条路径（极易混淆）

生产工作流 `Deploy Linketry` 有两种触发方式，**审批依据完全不同**：

| 触发方式 | 审批依据 | 需要预先改仓库变量？ |
|---------|---------|-------------------|
| `push` 到 `main` | 仓库变量 `LINKETRY_APPROVED_RELEASE` / `LINKETRY_APPROVED_COMMIT` 必须分别等于 `package.json` 版本和 `GITHUB_SHA` | **需要** |
| `workflow_dispatch` | 认证发起人在表单填的 `expected_release` / `expected_commit`；`scripts/deployment-release-approval.mjs` 将其写入 `GITHUB_ENV` **覆盖**仓库变量，门禁再读取 | **不需要** |

日常发版走 dispatch 最省事，不必改任何仓库变量：

```bash
gh workflow run deploy.yml --ref main -f confirm_release=true -f expected_release=0.31.5 -f expected_commit=<40位SHA>
```

#### `[skip production]` 只跳过生产

commit message 含 `[skip production]` 时：

- `Deploy Linketry`（生产）→ skip
- `Deploy Isolated Linketry Demo` → **仍然执行**。Demo 自动跟随 `main`，其门禁对 push 同步自动放行，版本从推送的 commit 派生
- `Deploy Linketry Project Site`（官网）→ 纯手动 `workflow_dispatch`，需确认短语 `DEPLOY LINKETRY SITE` + 精确 commit SHA，不受 push 影响

---

## 代码约定

### Backend (Worker)

#### 数据库 (`apps/worker/src/db/index.ts`)
- **所有 D1 SQL 必须在此文件**，路由处理器只调用这些函数
- **禁止在路由中内联 SQL**
- 函数命名：`getLink`, `listLinks`, `createLink`, `updateLink`, `deleteLink`

#### 缓存 (`apps/worker/src/cache/index.ts`)
- 所有 KV 读写在此文件
- 函数：`getCachedLink`, `setCachedLink`, `deleteCachedLink`
- 缓存 TTL（`calculateTTL`）：默认 24 小时；当 `expires_at` 更早时压缩到该时间点，已过期则跳过写入，交由重定向路径读 D1 最新状态
- 缓存预热（`cache/warmup.ts`）：Cron 按点击量倒序把热门活跃链接批量写入 KV

#### 响应 (`apps/worker/src/utils/response.ts`)
- `jsonOk(data)` — `{ success: true, data }`
- `jsonError(msg, status)` — `{ success: false, error: msg }`
- `htmlNotFound()` — 404 HTML 页面
- `htmlDisabled()` — 禁用链接 HTML 页面

#### ID 生成 (`apps/worker/src/utils/id.ts`)
- `generateId()` — 返回 12 字符随机 ID
- `generateSlug()` — 返回 6 字符随机 slug

### Frontend (Admin)

#### API 调用 (`apps/admin/src/api/`)
- **禁止在页面直接 `fetch()`**，使用类型化包装器
- 示例：
  ```ts
  import { listLinks } from '../api/links';
  const result = await listLinks({ page: 1, pageSize: 20 });
  ```

#### 组件 (`apps/admin/src/components/ui/`)
复用现有组件：
- `Button` — 所有按钮
- `Input` — 文本输入
- `Modal` — 弹窗对话框
- `ConfirmDialog` — 破坏性操作确认
- `Toast` — 临时通知（useToast）
- `Badge` / `StatusBadge` — 彩色标签

#### 认证状态
```ts
import { useAuth } from '../contexts/AuthContext';
const { authenticated, login, logout } = useAuth();
```

Token 存储在 `localStorage` 的 `linketry_token` 键。

---

## 导入系统

导入器在 `apps/worker/src/importers/`，实现 `ImportAdapter` 接口（来自 `@linketry/shared`，源文件 `packages/shared/src/types/index.ts` 和 `packages/shared/src/validators/index.ts`）：

```ts
interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

**导入规则**：
- Slug 冲突 → 跳过（绝不静默覆盖）
- 无效 URL → 跳过 + 报告失败
- 保留原始 `shortCode` 作为 slug

---

## 数据库迁移规则

- 基础模式在 `migrations/0001_init.sql`
- **禁止编辑现有迁移文件**
- 模式变更添加新的编号迁移文件
- 生产迁移前运行 `npm run deploy:preflight`

---

## 新增功能

### 添加新的 API 路由

1. 在 `apps/worker/src/db/index.ts` 添加 DB 函数
2. 创建/更新 `apps/worker/src/routes/<resource>.ts`
3. 在 `apps/worker/src/routes/api.ts` 的 `registerAdminApiRoutes(app)` 中注册路由（`index.ts` 只调用此函数，不直接注册路由）
4. 更新 `apps/admin/src/api/<resource>.ts` API 客户端

### 添加新的 Admin 页面

1. 创建 `apps/admin/src/pages/MyPage.tsx`
2. 在 `apps/admin/src/api/` 添加 API 函数（如需要）
3. 在 `apps/admin/src/App.tsx` 注册路由
4. 在 `apps/admin/src/components/Sidebar.tsx` 添加侧边栏链接

---

## 安全注意事项

- `LINKETRY_ADMIN_TOKEN` 必须在本地 `.dev.vars` 设置，生产通过 `wrangler secret put` 设置
- **禁止提交 `.dev.vars`**（已在 `.gitignore`）
- `long_url` 验证拒绝 `javascript:` 和 `data:` scheme
- Slug 验证：仅 `[a-zA-Z0-9_-]`，保留路径被阻止

---

## 重要文档

| 文档 | 内容 |
|------|------|
| `docs/ARCHITECTURE.md` | 重定向路径、运行时组件、故障边界 |
| `docs/DEVELOPMENT.md` | 代码放置、安全工作流、验证、发布规范 |
| `docs/API.md` | 认证路由行为和示例 |
| `docs/SELF_HOSTING.md` | 自托管部署指南 |
| `docs/DEPLOYMENT_PREFLIGHT.md` | 部署前检查门控 |
| `docs/IMPORT_ADAPTERS.md` | 导入适配器合约 |
| `docs/ANALYTICS.md` | 追踪、隐私、报告 |
| `AGENTS.md` | AI agent 指令 |
| `docs/TROUBLESHOOTING.md` | 常见故障排查 |
| `.codex/tasks/*.md` | 历次任务记录（做了什么、遗留什么） |
| `.codex/references/case-*.md` | **线上事故根因案例库**——排查 Admin 升级卡死、Pages 缓存、CORS、GitHub Actions environment 等问题前先翻这里 |

---

## 环境变量

完整清单以 `apps/worker/wrangler.toml.example` 和 `.dev.vars.example` 为准，不在此重复。

只记两条不看示例文件看不出来的约束：

- `VITE_LINKETRY_UPDATE_BRANCH`（Admin 构建期）**必须**与 Worker 的 `LINKETRY_UPDATE_BRANCH` 一致，否则版本检查会指向不同分支
- `VITE_LINKETRY_API_URL` 在 Admin 与 Worker 分离域部署时必填；同源 Quick Deploy 留空
