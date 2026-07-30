# 故障排查指南

本指南帮助你诊断和解决 Linketry 开发和部署中的常见问题。

---

## 开发环境问题

### 1. Worker 启动失败

**症状**：
- `npm run dev --workspace=apps/worker` 报错
- Wrangler 无法启动本地服务器

**检查清单**：

```bash
# 1. 检查 .dev.vars 文件
ls apps/worker/.dev.vars
# 应该包含：LINKETRY_ADMIN_TOKEN=<your-token>

# 2. 检查 wrangler.toml 配置
ls apps/worker/wrangler.toml
# 确认从 wrangler.toml.example 复制

# 3. 检查本地 D1 迁移
npm run db:migrate:local --workspace=apps/worker

# 4. 验证 Node.js 版本
node -v
# 应该是 v24.x.x
```

**常见错误**：

```
Error: Missing binding LINKETRY_ADMIN_TOKEN
→ 解决：创建 apps/worker/.dev.vars 并添加 LINKETRY_ADMIN_TOKEN=test-token
```

```
Error: D1 database not found
→ 解决：运行 npm run db:migrate:local --workspace=apps/worker
```

---

### 2. Admin 无法连接 Worker API

**症状**：
- 登录失败，显示 "Network Error"
- API 请求超时或被拒绝

**排查步骤**：

```bash
# 1. 确认 Worker 正在运行
curl http://localhost:8787/health
# 应返回：{"success":true,"data":{"status":"ok","name":"Linketry",...}}

# 2. 检查 Admin dev server
# 确保 Admin 在 http://localhost:5173 运行

# 3. 验证代理配置
cat apps/admin/vite.config.ts | grep proxy -A 5
# 应该代理 /api 到 http://localhost:8787
```

**常见错误**：

```
CORS error
→ 检查：Worker 是否正确设置 CORS headers
→ 解决：确认 apps/worker/src/index.ts 包含 CORS 中间件
```

```
401 Unauthorized
→ 检查：LINKETRY_ADMIN_TOKEN 是否一致
→ 解决：确保 .dev.vars 和登录使用相同的 token
```

---

### 3. 依赖安装失败

**症状**：
- `npm install` 报错
- 包版本冲突

**解决方案**：

```bash
# 1. 清理并重新安装
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install

# 2. 使用正确的 Node.js 版本
nvm use 24  # 如果使用 nvm
# 或
node -v  # 确认是 v24.x.x

# 3. 清理 npm 缓存
npm cache clean --force
npm install
```

---

### 4. 类型检查错误

**症状**：
- TypeScript 编译错误
- IDE 显示类型不匹配

**排查**：

```bash
# 1. 检查 TypeScript 版本
npx tsc --version
# 应该是 5.4+

# 2. 重新构建共享包
npm run build --workspace=packages/shared

# 3. 重启 TypeScript 服务器
# 在 VS Code 中：Ctrl+Shift+P → TypeScript: Restart TS Server
```

---

## 部署问题

### 1. Cloudflare Quick Deploy 失败

**症状**：
- D1/KV 资源创建失败
- Worker 部署超时

**排查步骤**：

```bash
# 1. 验证 Cloudflare 账户权限
wrangler whoami
# 确认账户 ID 和权限

# 2. 检查资源配额
# 登录 Cloudflare Dashboard → Workers & Pages
# 确认 D1、KV、Worker 配额未用尽

# 3. 查看部署日志
wrangler tail
```

**常见错误**：

```
Error: Insufficient permissions
→ 解决：使用具有 Workers、D1、KV 权限的 API Token
```

```
Error: Resource already exists
→ 解决：使用不同的资源名称前缀
```

---

### 2. 数据库迁移失败

**症状**：
- `npm run db:migrate:remote` 报错
- 迁移卡住不动

**排查步骤**：

```bash
# 1. 检查现有迁移状态
wrangler d1 migrations list DB --remote

# 2. 运行 preflight 检查
npm run deploy:preflight -- --track upgrade

# 3. 生成迁移摘要
npm run deploy:migration-digest

# 4. 检查 D1 数据库连接
wrangler d1 execute DB --remote --command "SELECT 1"
```

**解决方案**：

```bash
# 如果迁移卡住，检查是否有锁
wrangler d1 execute DB --remote --command "SELECT * FROM _cf_KV WHERE key = 'migration_lock'"

# 手动清理锁（谨慎操作）
wrangler d1 execute DB --remote --command "DELETE FROM _cf_KV WHERE key = 'migration_lock'"
```

---

### 3. Worker 部署成功但无法访问

**症状**：
- `wrangler deploy` 成功
- 但 `https://<worker>.workers.dev` 返回 404

**排查**：

```bash
# 1. 验证 Worker 状态
wrangler deployments list

# 2. 测试 health 端点
curl https://<worker>.<account>.workers.dev/health

# 3. 检查自定义域名配置
# Dashboard → Workers & Pages → <worker> → Settings → Domains
```

**常见问题**：

```
Custom domain not working
→ 检查 DNS 记录是否正确
→ 确认 SSL 证书已激活
→ 等待 DNS 传播（可能需要几分钟到几小时）
```

---

### 4. Admin Pages 部署失败

**症状**：
- Pages 部署超时
- 构建失败

**排查**：

```bash
# 1. 本地验证构建
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin

# 2. 检查 Pages 项目配置
wrangler pages project list

# 3. 查看 Pages 部署日志
# Dashboard → Workers & Pages → <pages-project> → Deployments
```

**解决方案**：

```bash
# 重新部署
wrangler pages deploy apps/admin/dist --project-name=linketry-admin
```

---

## 性能问题

### 1. 重定向响应慢

**症状**：
- 短链接重定向超过 500ms
- 用户体验不佳

**诊断**：

```bash
# 1. 检查 KV 缓存命中率
# 在 Worker 中添加日志
console.log('KV hit:', kvHit ? 'yes' : 'no');

# 2. 使用 wrangler tail 监控
wrangler tail --format json | grep redirect_time

# 3. 测试重定向时间
time curl -I https://go.example.com/test-slug
```

**优化建议**：

- 确保热门链接已缓存到 KV
- 检查 D1 查询是否有索引
- 考虑预热常用链接

---

### 2. Admin 加载缓慢

**症状**：
- Admin 首屏加载超过 5 秒
- 页面切换卡顿

**排查**：

```bash
# 1. 检查网络请求
# 浏览器 DevTools → Network
# 找出慢的 API 请求

# 2. 查看 API 响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://go.example.com/api/v1/links

# curl-format.txt:
# time_total: %{time_total}s
```

**优化建议**：

- 启用浏览器缓存
- 减少单页数据量（使用分页）
- 优化大列表渲染（虚拟滚动）

---

### 3. D1 查询超时

**症状**：
- API 请求超时
- D1 查询返回慢

**诊断**：

```bash
# 1. 检查查询计划
wrangler d1 execute DB --remote --command "EXPLAIN QUERY PLAN SELECT * FROM links WHERE domain = 'go.example.com' AND slug = 'test'"

# 2. 验证索引存在
wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='index'"
```

**优化**：

```sql
-- 添加缺失的索引
CREATE INDEX IF NOT EXISTS idx_links_domain_slug 
ON links(domain, slug) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_visits_link_timestamp 
ON visits(link_id, timestamp);
```

---

## 数据问题

### 1. 导入失败

**症状**：
- Shlink/CSV 导入卡住
- 导入显示失败

**排查**：

```bash
# 1. 检查导入任务状态
curl -H "Authorization: Bearer <token>" \
  https://go.example.com/api/v1/import/jobs

# 2. 查看失败原因
# Admin → Import/Export → 查看导入历史
```

**常见问题**：

- **文件过大**：拆分成多个小文件
- **格式错误**：验证 JSON/CSV 格式
- **Slug 冲突**：使用 "rename" 策略

---

### 2. 数据丢失

**症状**：
- 链接突然消失
- 访问统计不准确

**紧急措施**：

```bash
# 1. 立即创建备份
curl -X POST -H "Authorization: Bearer <token>" \
  https://go.example.com/api/v1/backups

# 2. 检查最近的 R2 备份
# Admin → Backups → 查看可用备份

# 3. 如果需要，从备份恢复
# Admin → Backups → Restore
```

**预防措施**：

- 启用自动每日备份
- 定期下载备份到本地
- 重要操作前手动备份

---

### 3. KV 缓存不一致

**症状**：
- 编辑链接后重定向未更新
- 禁用的链接仍然可访问

**解决方案**：

```bash
# 1. 清除特定链接缓存
curl -X POST -H "Authorization: Bearer <token>" \
  https://go.example.com/api/v1/cache/clear/test-slug

# 2. 清除所有缓存（谨慎）
# Admin → Maintenance → Clear KV Cache
```

**根本原因**：

- KV 传播延迟（正常，最多几秒）
- 缓存更新逻辑 bug
- 多域名缓存键不匹配

---

## 安全问题

### 1. Admin Token 泄露

**紧急响应**：

```bash
# 1. 立即轮换 token
wrangler secret put LINKETRY_ADMIN_TOKEN

# 2. 撤销已知 API tokens
# Admin → API Tokens → Revoke

# 3. 检查审计日志
# Admin → Audit Logs → 查看可疑操作
```

---

### 2. 恶意短链接

**症状**：
- 发现钓鱼链接
- 垃圾短链接

**处理**：

```bash
# 1. 立即禁用
# Admin → Links → 找到链接 → Disable

# 2. 查看访问记录
# Admin → Analytics → 单个链接分析

# 3. 如果需要，删除
# Admin → Links → Delete
```

---

## 获取帮助

### 日志收集

提交 issue 前，请收集以下信息：

```bash
# 1. 版本信息
curl https://go.example.com/health

# 2. Worker 日志
wrangler tail --format pretty > worker.log

# 3. 浏览器控制台
# 打开 DevTools → Console → 截图或复制错误

# 4. 网络请求
# DevTools → Network → 导出 HAR 文件
```

### 社区支持

- **GitHub Issues**：[github.com/everett7623/Linketry/issues](https://github.com/everett7623/Linketry/issues)
- **文档**：[linketry.com](https://linketry.com)
- **官方 Demo**：[demo.linketry.com](https://demo.linketry.com)

### 报告 Bug

请包含：
- Linketry 版本
- Node.js 版本
- 错误信息完整输出
- 复现步骤
- 预期行为 vs 实际行为

---

## 预防性维护

### 定期检查清单

```bash
# 每周
- [ ] 检查 Worker 日志是否有异常
- [ ] 验证备份是否正常运行
- [ ] 查看 API token 使用情况

# 每月
- [ ] 审查审计日志
- [ ] 检查磁盘空间（D1 大小）
- [ ] 更新依赖包（如有安全更新）
- [ ] 测试备份恢复流程

# 升级前
- [ ] 阅读 CHANGELOG
- [ ] 创建完整备份
- [ ] 在测试环境验证
- [ ] 准备回滚方案
```

---

## 常见错误码

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| 401 | 认证失败 | 检查 token 是否正确 |
| 404 | 资源不存在 | 验证 slug/ID 是否正确 |
| 409 | Slug 冲突 | 使用不同的 slug |
| 429 | 请求过多 | 等待或联系管理员 |
| 500 | 服务器错误 | 查看 Worker 日志 |
| 503 | 服务不可用 | 检查 D1/KV 绑定 |

---

## 快速诊断流程图

```
遇到问题
  ↓
能访问 /health 吗？
  ├─ 否 → Worker 未运行或域名配置错误
  │       → 检查 wrangler deployments list
  │
  └─ 是 → Worker 运行正常
         ↓
    能登录 Admin 吗？
      ├─ 否 → Token 错误或 API 不可达
      │       → 检查 LINKETRY_ADMIN_TOKEN
      │       → 检查 VITE_LINKETRY_API_URL
      │
      └─ 是 → 认证正常
             ↓
        功能是否正常？
          ├─ 否 → 查看具体功能章节
          │
          └─ 是 → 问题已解决 ✅
```
