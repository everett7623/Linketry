# 贡献指南

感谢考虑为 Linketry 做贡献。

**最后更新**：2026-11-20  
**当前版本**：v0.35.4

## 开始之前

1. 阅读 [`AGENTS.md`](../AGENTS.md) 的黄金规则与硬限制  
2. 阅读 [DEVELOPMENT.md](DEVELOPMENT.md)（工作流、验证、发布清单）与 [ARCHITECTURE.md](ARCHITECTURE.md)  
3. 文档地图：[README.md](README.md)  
4. 中文速查：[`CLAUDE.md`](../CLAUDE.md)

只实现请求范围内的改动；不要擅自引入 V10 多用户/团队能力。重定向稳定性优先，统计必须走 `ctx.waitUntil()`。

## 本地开发

```bash
npm install
# Worker
Copy-Item apps/worker/wrangler.toml.example apps/worker/wrangler.toml
Copy-Item apps/worker/.dev.vars.example apps/worker/.dev.vars
# 编辑 .dev.vars 设置 LINKETRY_ADMIN_TOKEN
npm run db:migrate:local --workspace=apps/worker
npm run dev --workspace=apps/worker
# Admin（另一终端）
npm run dev --workspace=apps/admin
```

完整命令与测试约定见 [DEVELOPMENT.md](DEVELOPMENT.md)。Admin 文案贡献见 [TRANSLATIONS.md](TRANSLATIONS.md)。

## Pull Request

1. Fork / 分支，基于最新 `main`
2. 实现并通过相关测试；勿提交 secrets
3. 有意项目变更需同步版本与 `CHANGELOG.md`（见 DEVELOPMENT Release Checklist；维护者通常负责发版元数据）
4. 打开 PR，说明动机、范围与验证步骤

### PR 描述模板

```markdown
## Summary
- …

## Test plan
- [ ] …
```

### Bug 报告模板

```markdown
## Bug 描述
## 复现步骤
## 预期 / 实际行为
## 环境（Linketry 版本、浏览器、OS）
## 错误日志 / 截图
```

### 功能请求模板

```markdown
## 功能描述
## 使用场景
## 建议实现（可选）
## 替代方案（可选）
```

## 审查关注点

- 不破坏重定向；不把 KV 当主数据源；导入默认 `skip`
- 新 API 走 `src/db` / `src/api` 约定；复用现有 UI 组件
- 有测试覆盖关键路径；无 secrets

## 许可

贡献代码即以 **GPL-3.0-only** 许可发布。

问题请用 GitHub Issues / Discussions；保持友好与建设性反馈。
