# 贡献指南

感谢你考虑为 Linketry 做出贡献！本指南将帮助你了解如何参与项目开发。

**最后更新**：2026-08-19  
**当前版本**：v0.31.3  
**生产版本**：v0.31.1

---

## 开始之前

### 阅读核心文档

在开始贡献前，请先阅读：

- `AGENTS.md` — 完整的开发规范和黄金规则（英文）
- `CLAUDE.md` — Claude Code 快速参考（中文）
- `PROGRESS.md` — 当前构建状态
- `TASKS.md` — 活跃任务列表
- `docs/ROADMAP.md` — 产品路线图

### 理解黄金规则

⚠️ **必读：[AGENTS.md 中的黄金规则](../AGENTS.md#golden-rules)**

Linketry 有 7 条不可妥协的核心规则：

1. **重定向稳定性是第一优先级** — 未经明确指示不要触碰重定向逻辑
2. **统计失败绝不能破坏重定向** — 分析必须通过 `ctx.waitUntil()` 运行
3. **只实现请求的范围** — 不要擅自做 V10 多用户/团队等未请求能力；已上线的进阶功能应正常维护
4. **KV 只是缓存** — D1 是真实数据源，绝不让 KV 成为主数据源
5. **导入时绝不静默覆盖现有 slug** — 默认冲突策略是 `skip`
6. **绝不提交 secrets** — `LINKETRY_ADMIN_TOKEN` 等密钥放在 `.dev.vars` 或 Wrangler secrets 中
7. **官网 / 生产 / Demo 三轨隔离** — 禁止在真实实例启用 `LINKETRY_DEMO_MODE=read-only`

---

## 技术栈要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 24.x（`>=24 <25`） | 运行时环境 |
| npm | 10+ | 包管理器 |
| TypeScript | 5.4+ | 类型系统 |
| Wrangler | 4 | Cloudflare CLI |
| Cloudflare | 账号 | D1, KV, Worker, Pages |

## 技术栈

| 层 | 技术 |
|----|------|
| Backend | Cloudflare Workers + TypeScript |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Frontend | React + Vite + Tailwind CSS |
| Monorepo | npm workspaces |

---

## 开发流程

### 1. Fork 和 Clone

```bash
# Fork 仓库到你的 GitHub 账号
# 然后 clone

git clone https://github.com/YOUR_USERNAME/Linketry.git
cd Linketry
npm install
```

### 2. 设置开发环境

```bash
# 复制配置文件
cp apps/worker/wrangler.toml.example apps/worker/wrangler.toml
cp apps/worker/.dev.vars.example apps/worker/.dev.vars

# 编辑 .dev.vars，设置：
# LINKETRY_ADMIN_TOKEN=your-local-dev-token

# 运行本地数据库迁移
npm run db:migrate:local --workspace=apps/worker

# 启动 Worker（终端 1）
npm run dev --workspace=apps/worker

# 启动 Admin（终端 2）
npm run dev --workspace=apps/admin
```

### 3. 创建功能分支

```bash
# 从 main 创建新分支
git checkout -b feat/your-feature-name

# 或修复 bug
git checkout -b fix/issue-description
```

**分支命名规范**：
- `feat/` — 新功能
- `fix/` — Bug 修复
- `docs/` — 文档更新
- `chore/` — 构建/工具链更新
- `refactor/` — 重构
- `test/` — 测试更新

### 4. 开发和测试

```bash
# 运行测试
npm run test:worker
npm run test:admin
npm run test:deployment

# 类型检查
npm run build

# 本地构建验证
npm run build --workspace=apps/admin
npm run build --workspace=apps/site
```

### 5. Commit 规范

**格式**：
```
<type>: <subject>

[optional body]

[optional footer]
```

**Type 可选值**：
- `feat` — 新功能
- `fix` — Bug 修复
- `docs` — 文档更新
- `chore` — 构建/工具链更新
- `refactor` — 重构（不改变外部行为）
- `test` — 测试更新
- `perf` — 性能优化
- `style` — 代码格式（不影响功能）

**Subject 要求**：
- 使用简体中文
- 简洁明了（< 50 字符）
- 不要以句号结尾
- 使用祈使语气（"添加" 而不是 "添加了"）

**示例**：

```bash
# ✅ 好的 commit
git commit -m "feat: 添加批量删除链接功能"
git commit -m "fix: 修复 KV 缓存过期逻辑"
git commit -m "docs: 更新自托管部署指南"
git commit -m "refactor: 优化 D1 查询性能"

# ❌ 避免
git commit -m "update files"  # 不明确
git commit -m "修复了一些bug。"  # 不够具体
git commit -m "WIP"  # 不要提交未完成的工作
```

**禁止**：
- ❌ 不要添加 `Co-Authored-By` 或 AI 署名
- ❌ 不要在 commit 中包含密钥
- ❌ 不要提交 `.dev.vars` 文件
- ❌ 不要提交 `node_modules/`

### 6. 提交 Pull Request

**准备 PR**：

```bash
# 1. 确保所有测试通过
npm run test:worker
npm run test:admin
npm run test:deployment

# 2. 更新文档（如果需要）
# 编辑 CHANGELOG.md
# 更新 PROGRESS.md（如果功能状态改变）

# 3. Rebase 到最新的 main
git fetch upstream
git rebase upstream/main

# 4. Push 到你的 fork
git push origin feat/your-feature-name
```

**PR 标题**：
- 简洁明了（< 70 字符）
- 使用简体中文
- 示例：`feat: 添加健康检查端点`、`fix: 修复导入冲突处理`

**PR 描述模板**：

```markdown
## 变更说明

简要描述本 PR 的变更内容和目的。

## 相关 Issue

Closes #123
Fixes #456

## 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试 (test)
- [ ] 构建/工具链 (chore)

## 测试情况

- [ ] Worker 测试通过
- [ ] Admin 单元测试通过
- [ ] Admin 浏览器测试通过
- [ ] 部署测试通过
- [ ] 手动测试完成

## 影响范围

- [ ] 重定向逻辑
- [ ] API 行为
- [ ] Admin UI
- [ ] 数据库模式
- [ ] 配置文件
- [ ] 文档

## 破坏性变更

- [ ] 本 PR 包含破坏性变更

如果有破坏性变更，请详细说明：
- 什么改变了
- 为什么需要改变
- 如何迁移

## 截图（如有 UI 变更）

在此添加截图或 GIF

## 检查清单

- [ ] 我已阅读 CONTRIBUTING.md
- [ ] 我的代码遵循项目的代码风格
- [ ] 我已更新相关文档
- [ ] 我已添加必要的测试
- [ ] 所有测试都通过
- [ ] 我的 commit message 符合规范
- [ ] 我已更新 CHANGELOG.md（如果是用户可见的变更）
```

---

## 代码规范

### Backend (Worker)

#### 数据库操作

```typescript
// ✅ 好的做法：所有 SQL 集中在 db/index.ts
// apps/worker/src/db/index.ts
export async function getLink(
  env: Env,
  domain: string,
  slug: string
): Promise<Link | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM links WHERE domain = ? AND slug = ?'
  ).bind(domain, slug).first();
  return result || null;
}

// apps/worker/src/routes/links.ts
import { getLink } from '../db';

router.get('/links/:slug', async (c) => {
  const link = await getLink(c.env, domain, slug);
  // ...
});

// ❌ 避免：在路由中内联 SQL
router.get('/links/:slug', async (c) => {
  const result = await c.env.DB.prepare('SELECT ...');  // ❌
});
```

#### 缓存操作

```typescript
// ✅ 好的做法：所有 KV 操作集中在 cache/index.ts
// apps/worker/src/cache/index.ts
export async function getCachedLink(
  kv: KVNamespace,
  domain: string,
  slug: string
): Promise<CachedLink | null> {
  const key = `linketry:slug:${domain}:${slug}`;
  const cached = await kv.get(key, 'json');
  return cached;
}

// ❌ 避免：直接操作 KV
const cached = await c.env.KV.get(`linketry:slug:${domain}:${slug}`);  // ❌
```

#### 异步统计写入

```typescript
// ✅ 好的做法：使用 ctx.waitUntil()
export async function handleRedirect(c: Context) {
  const link = await getLink(c.env, domain, slug);
  
  // 立即重定向
  const response = Response.redirect(link.long_url, link.redirect_type);
  
  // 异步记录访问
  c.executionCtx.waitUntil(
    recordVisit(c.env, link.id, visitData)
  );
  
  return response;
}

// ❌ 避免：阻塞重定向
export async function handleRedirect(c: Context) {
  const link = await getLink(c.env, domain, slug);
  await recordVisit(c.env, link.id, visitData);  // ❌ 阻塞
  return Response.redirect(link.long_url, link.redirect_type);
}
```

### Frontend (Admin)

#### API 调用

```typescript
// ✅ 好的做法：使用类型化 API 包装器
// apps/admin/src/pages/Links.tsx
import { listLinks, createLink } from '../api/links';

const links = await listLinks({ page: 1, pageSize: 20 });
const newLink = await createLink({ slug: 'test', long_url: 'https://example.com' });

// ❌ 避免：直接 fetch
const response = await fetch('/api/v1/links');  // ❌
const data = await response.json();
```

#### 组件复用

```typescript
// ✅ 好的做法：复用现有组件
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Toast, useToast } from '../components/ui/Toast';

function MyComponent() {
  const { showToast } = useToast();
  
  return (
    <>
      <Button onClick={() => showToast('Success!', 'success')}>
        保存
      </Button>
      <Modal open={open} onClose={onClose}>
        {/* ... */}
      </Modal>
    </>
  );
}

// ❌ 避免：重新实现已有组件
function MyButton() {  // ❌ Button 已存在
  return <button className="...">Click</button>;
}
```

#### 状态管理

```typescript
// ✅ 好的做法：使用 Context
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

function MyComponent() {
  const { authenticated, user } = useAuth();
  const { t } = useLocale();
  
  return <div>{t('welcome')}</div>;
}

// ❌ 避免：直接读取 localStorage
const token = localStorage.getItem('linketry_token');  // ❌
```

---

## 发布规范

如果你的 PR 包含功能变更或 bug 修复，需要同步更新：

### 1. 版本号（维护者负责）

```bash
# 使用语义化版本号
# MAJOR.MINOR.PATCH
# 0.29.20 → 0.29.21 (patch)
# 0.29.20 → 0.30.0 (minor)
# 0.29.20 → 1.0.0 (major)
```

### 2. CHANGELOG.md

```markdown
## [0.29.21] - 2026-07-30

### Added
- 添加批量删除链接功能

### Fixed
- 修复 KV 缓存过期逻辑
- 修复移动端导航栏折叠问题

### Changed
- 优化 D1 查询性能

### Security
- 更新依赖包修复安全漏洞
```

### 3. PROGRESS.md（如需要）

如果功能状态改变（从 "In Progress" 到 "Complete"），更新 `PROGRESS.md`。

### 4. TASKS.md（如需要）

如果完成了任务列表中的任务，移动到 "Completed" 部分。

---

## 审查标准

PR 会从以下方面审查：

### 功能正确性
- ✅ 实现符合需求
- ✅ 边界情况处理正确
- ✅ 错误处理完善

### 代码质量
- ✅ 遵循项目代码风格
- ✅ 变量命名清晰
- ✅ 函数职责单一
- ✅ 避免重复代码

### 测试覆盖
- ✅ 新功能有测试
- ✅ Bug 修复有回归测试
- ✅ 所有测试通过

### 性能
- ✅ 无明显性能问题
- ✅ 数据库查询优化
- ✅ 不阻塞关键路径

### 安全
- ✅ 输入验证
- ✅ 无 SQL 注入风险
- ✅ 无 XSS 风险
- ✅ 敏感数据保护

### 文档
- ✅ 代码注释充分
- ✅ 复杂逻辑有说明
- ✅ API 文档更新
- ✅ CHANGELOG 更新

---

## 贡献类型

### Bug 报告

提交 bug 前，请：
- 搜索现有 issues 确认未重复
- 使用最新版本复现
- 收集必要信息

**Bug 报告模板**：

```markdown
## Bug 描述

简要描述 bug。

## 复现步骤

1. 打开 Admin
2. 点击 "创建链接"
3. 输入 ...
4. 看到错误

## 预期行为

应该显示 ...

## 实际行为

显示了 ...

## 环境信息

- Linketry 版本：v0.31.3
- Node.js 版本：v24.0.0
- 浏览器：Chrome 120
- 操作系统：Windows 11

## 错误日志

```
Error: ...
```

## 截图

（如适用）
```

### 功能请求

**功能请求模板**：

```markdown
## 功能描述

简要描述你想要的功能。

## 使用场景

为什么需要这个功能？它解决什么问题？

## 建议实现

你认为应该如何实现？（可选）

## 替代方案

是否考虑过其他方案？（可选）

## 相关功能

是否与现有功能相关？
```

### 文档改进

文档贡献同样重要！

- 修正错别字
- 改进说明清晰度
- 添加示例
- 翻译文档

### 测试增强

- 添加缺失的测试
- 提高测试覆盖率
- 改进测试可读性

---

## 沟通渠道

- **GitHub Issues** — Bug 报告、功能请求
- **GitHub Discussions** — 一般讨论、问题
- **Pull Requests** — 代码贡献

### 沟通礼仪

- 保持友好和专业
- 尊重不同观点
- 建设性反馈
- 耐心等待回复

---

## 许可协议

贡献代码即表示你同意将你的工作以 GPL-3.0-only 许可发布。

---

## 致谢

感谢所有贡献者！你的参与让 Linketry 变得更好。

---

## 问题？

如有疑问，请：
- 阅读现有文档
- 搜索 GitHub Issues
- 创建新 Discussion
