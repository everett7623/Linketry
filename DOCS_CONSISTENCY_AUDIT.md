# 开发文档统一性审查报告

审查日期：2026-07-30
审查范围：AGENTS.md, CLAUDE.md, docs/DEVELOPMENT.md, docs/CONTRIBUTING.md, docs/ARCHITECTURE.md

---

## 🔍 发现的不一致问题

### 1. 黄金规则表述差异

| 文档 | 规则数量 | 语言 | 表述风格 |
|------|---------|------|---------|
| AGENTS.md | 6 条 | 英文 | "Never touch redirect logic" |
| CLAUDE.md | 6 条 | 中文 | "未经明确指示不要触碰重定向逻辑" |
| docs/ARCHITECTURE.md | 7 条 | 英文 | "Redirect stability comes before..." |
| docs/CONTRIBUTING.md | 6 条 | 中文 | 与 CLAUDE.md 一致 |
| docs/DEVELOPMENT.md | ❌ 缺失 | - | 只引用 AGENTS.md |

**问题**：
1. ARCHITECTURE.md 有 7 条设计原则，但与黄金规则重叠但不完全一致
2. DEVELOPMENT.md 没有直接列出黄金规则
3. 表述细节略有差异

### 2. 技术版本要求不统一

| 文档 | Node.js | npm | TypeScript | Wrangler |
|------|---------|-----|------------|----------|
| AGENTS.md | ❌ 未指定 | ❌ 未指定 | ✅ 提到 monorepo | ❌ 未指定 |
| CLAUDE.md | ✅ 24.x（推荐），>=20 | ✅ 10+ | ✅ 5.4+ | ✅ 4 |
| docs/DEVELOPMENT.md | ✅ 24.x | ✅ 10+ | ❌ 未指定 | ✅ 从依赖安装 |
| docs/CONTRIBUTING.md | ❌ 未指定 | ❌ 未指定 | ❌ 未指定 | ❌ 未指定 |
| README.md | ✅ 24.x（推荐），>=20 | ✅ 10+ | ❌ 未指定 | ✅ 4 |

**问题**：
- AGENTS.md 完全缺失版本要求
- CONTRIBUTING.md 没有明确技术栈版本

### 3. 项目进度状态不一致

| 文档 | 最后更新 | 当前版本 | 生产版本 |
|------|---------|---------|---------|
| PROGRESS.md | 2026-07-29 | 0.29.20 prepared | 0.29.18 live |
| AGENTS.md | ❌ 未标注 | ❌ 未提及 | ❌ 未提及 |
| CLAUDE.md | ✅ 引用 PROGRESS.md | ❌ 未提及 | ❌ 未提及 |
| CHANGELOG.md | 2026-07-30 | Unreleased | 0.29.20 |

**问题**：
- PROGRESS.md 显示 0.29.20 未发布，但 CHANGELOG 已记录
- 多个文档没有版本信息

### 4. 重定向流程描述差异

**AGENTS.md**（简化版）：
```
User visits /:slug
→ Worker checks KV cache
→ KV hit: redirect immediately
→ KV miss: query D1 links table
→ Found active link: write KV, then redirect
→ async ctx.waitUntil(): record visit stats
```

**ARCHITECTURE.md**（完整版）：
```
1. Normalize the request hostname and read the slug.
2. Read KV key linketry:slug:<domain>:<slug>.
3. On a KV miss, query D1 by domain and slug...
4. On a KV hit, re-check D1 so disable, delete, edit...
5. If D1 is temporarily unavailable after a cache hit...
...（10 个步骤）
```

**CLAUDE.md**（中文简化版）：
```
GET /:slug
  → 检查 KV  linketry:slug:<domain>:<slug>
    → HIT  → 重新验证 D1 状态 → 301/302 重定向
    → MISS → 查询 D1 links 表
```

**问题**：
- 三个文档详细程度不同
- CLAUDE.md 提到了"重新验证 D1"，与最新优化一致
- AGENTS.md 过于简化，缺少关键细节

### 5. 发布规范位置不统一

| 规范内容 | AGENTS.md | CLAUDE.md | docs/CONTRIBUTING.md |
|---------|-----------|-----------|---------------------|
| 版本号升级 | ✅ 详细 | ✅ 简略 | ✅ 详细 |
| CHANGELOG 更新 | ✅ | ✅ | ✅ |
| 文档同步 | ✅ | ✅ | ✅ |
| Commit 规范 | ❌ | ✅ | ✅ 详细 |
| PR 模板 | ❌ | ❌ | ✅ |

---

## ✅ 建议的统一方案

### 方案 A：主从结构（推荐）

```
CLAUDE.md（Claude Code 专用）
  ├─ 完整的黄金规则（6 条）
  ├─ 技术栈和版本要求
  ├─ 项目状态引用
  └─ 简化的架构概览

AGENTS.md（通用 AI agent）
  ├─ 完整的黄金规则（6 条）
  ├─ 技术栈和版本要求（新增）
  ├─ 发布规范（保留）
  └─ 详细的代码约定

docs/ARCHITECTURE.md（架构文档）
  ├─ 设计原则（7 条，保持独立）
  ├─ 详细的重定向流程（10 步）
  └─ 运行时拓扑

docs/DEVELOPMENT.md（开发指南）
  ├─ 引用黄金规则（指向 AGENTS.md）
  ├─ 技术栈要求（与 CLAUDE.md 一致）
  └─ 开发工作流程

docs/CONTRIBUTING.md（贡献指南）
  ├─ 引用黄金规则（指向 AGENTS.md）
  ├─ 技术栈要求（新增）
  ├─ Commit 规范（保留）
  └─ PR 流程（保留）
```

### 方案 B：单一真相源

将所有规范集中到 AGENTS.md，其他文档引用。

**优点**：绝对统一
**缺点**：维护者需要频繁跳转文档

---

## 🔧 具体修改建议

### 1. 统一黄金规则（所有文档）

**标准表述（英文）**：
```markdown
## Golden Rules

1. **Redirect stability is the #1 priority** — Never touch redirect logic without explicit instruction
2. **Stats failures must not break redirects** — Analytics must run via `ctx.waitUntil()`
3. **Only implement the requested version** — Do not write V2/V3/V4 features unless explicitly asked
4. **KV is cache only** — D1 is the source of truth; never make KV the primary data source
5. **Never silently overwrite existing slugs** — Default import conflict strategy is `skip`
6. **Never commit secrets** — `LINKETRY_ADMIN_TOKEN` and secrets go in `.dev.vars` or Wrangler secrets
```

**标准表述（中文）**：
```markdown
## 黄金规则

1. **重定向稳定性是第一优先级** — 未经明确指示不要触碰重定向逻辑
2. **统计失败绝不能破坏重定向** — 分析必须通过 `ctx.waitUntil()` 运行
3. **只实现请求的版本** — 除非明确要求，不要编写 V2/V3/V4 功能
4. **KV 只是缓存** — D1 是真实数据源，绝不让 KV 成为主数据源
5. **导入时绝不静默覆盖现有 slug** — 默认冲突策略是 `skip`
6. **绝不提交 secrets** — `LINKETRY_ADMIN_TOKEN` 等密钥放在 `.dev.vars` 或 Wrangler secrets 中
```

### 2. 统一技术栈版本要求

**所有文档应包含**：
```markdown
## 技术栈要求

| 工具 | 版本 |
|------|------|
| Node.js | 24.x（推荐），>=20 |
| npm | 10+ |
| TypeScript | 5.4+ |
| Wrangler | 4 |

## 运行时

| 层 | 技术 |
|----|------|
| Backend | Cloudflare Workers + TypeScript |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Frontend | React + Vite + Tailwind CSS |
| Monorepo | npm workspaces |
```

### 3. 统一重定向流程描述

**建议**：
- AGENTS.md：保留简化版（5 步）
- ARCHITECTURE.md：保留详细版（10 步）
- CLAUDE.md：更新为中等详细版（7 步），与最新优化一致

### 4. 统一项目状态标注

**所有主要文档应包含**：
```markdown
---
最后更新：2026-07-30
当前版本：v0.29.20+optimization（本地）
生产版本：v0.29.18
---
```

### 5. 新增：黄金规则演进记录

```markdown
## 黄金规则演进

| 版本 | 变更 | 原因 |
|------|------|------|
| v0.1 | 初始 6 条规则 | 项目启动 |
| v0.29.20 | 规则 2 强调 `ctx.waitUntil()` | 性能优化后明确 |
| v0.29.20 | 规则 4 强化"KV 只是缓存" | 智能缓存后重申 |
```

---

## 📝 实施计划

### Phase 1: 核心文档（高优先级）

1. ✅ AGENTS.md
   - [ ] 补充技术栈版本要求
   - [ ] 更新重定向流程（提到 D1 重验证）
   - [ ] 添加版本标注

2. ✅ CLAUDE.md
   - [x] 已有完整黄金规则
   - [x] 已有技术栈要求
   - [ ] 添加版本标注

3. ✅ docs/ARCHITECTURE.md
   - [ ] 在设计原则章节引用黄金规则
   - [ ] 明确设计原则 vs 黄金规则的关系

### Phase 2: 扩展文档（中优先级）

4. ✅ docs/DEVELOPMENT.md
   - [ ] 在开头引用黄金规则
   - [ ] 补充技术栈版本要求
   - [ ] 添加版本标注

5. ✅ docs/CONTRIBUTING.md
   - [x] 已有黄金规则
   - [ ] 补充技术栈版本要求
   - [ ] 添加版本标注

### Phase 3: 状态文档（持续更新）

6. ✅ PROGRESS.md
   - [ ] 更新为 v0.29.20+optimization
   - [ ] 添加短期优化状态

7. ✅ CHANGELOG.md
   - [x] 已更新 Unreleased 章节

---

## 🎯 统一后的文档结构

```
核心规范层（单一真相源）
├── AGENTS.md - AI agent 完整指令（英文）
├── CLAUDE.md - Claude Code 快速参考（中文）
└── docs/ARCHITECTURE.md - 架构设计原则

开发指南层（引用核心）
├── docs/DEVELOPMENT.md - 开发工作流
├── docs/CONTRIBUTING.md - 贡献流程
├── docs/PERFORMANCE.md - 性能优化
├── docs/TROUBLESHOOTING.md - 故障排查

状态跟踪层（实时更新）
├── PROGRESS.md - 构建状态
├── TASKS.md - 活跃任务
└── CHANGELOG.md - 版本历史
```

---

## ⚠️ 注意事项

1. **向后兼容**：所有更新不改变现有功能
2. **渐进更新**：优先更新核心文档
3. **交叉引用**：避免重复内容，使用引用
4. **版本标注**：重要文档都应标注更新日期和版本

---

## ✅ 成功标准

- [ ] 所有文档的黄金规则表述一致
- [ ] 技术栈版本要求统一
- [ ] 重定向流程描述层次清晰
- [ ] 项目版本信息同步
- [ ] 文档间交叉引用正确
