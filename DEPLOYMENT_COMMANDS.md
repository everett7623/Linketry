# Linketry v0.29.20+optimization 部署命令清单

本文档提供完整的部署命令，可以逐步复制执行。

---

## 前提条件

确保已安装：
- Node.js 24.x
- npm 10+
- Wrangler 4
- 已配置 Cloudflare 凭证

---

## 步骤 0: 环境检查

```bash
# 检查版本
node --version
npm --version
wrangler --version

# 拉取最新代码
git checkout main
git pull origin main
```

---

## 步骤 1: 备份数据库（⚠️ 必须！）

### 方法 A: 通过 Admin 面板
1. 访问 Admin
2. 进入 Settings → Backups
3. 点击 "Create Backup"
4. 等待备份完成

### 方法 B: 通过 API
```bash
# 替换 <your-admin-token> 和 <your-api-url>
curl -X POST \
  -H "Authorization: Bearer <your-admin-token>" \
  https://<your-api-url>/api/v1/backups
```

**✅ 确认备份成功后再继续！**

---

## 步骤 2: 应用数据库迁移

```bash
# 应用性能索引迁移
npm run db:migrate:remote --workspace=apps/worker
```

**预期输出**：
```
✅ 0003_performance_indexes.sql
🚣 11 commands executed successfully
```

**如果失败**：
- 检查 Wrangler 凭证
- 检查 D1 数据库配置
- 查看错误日志

---

## 步骤 3: 验证索引创建

```bash
# 查看所有索引
wrangler d1 execute DB --remote --command \
  "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
```

**应该看到 10 个新索引**：
- idx_links_domain_slug
- idx_links_clicks
- idx_visits_link_created
- idx_visits_country_device
- idx_visits_created_link
- idx_links_domain_created
- idx_links_tags
- idx_links_expires_at
- idx_audit_logs_created
- idx_import_jobs_status_created

---

## 步骤 4: 部署 Worker

```bash
# 部署 Worker
npm run deploy --workspace=apps/worker
```

**预期输出**：
```
✅ Published to https://<worker>.workers.dev
✅ Current Version ID: <version>
```

**如果失败**：
- 检查 wrangler.toml 配置
- 检查 Cloudflare 账号权限
- 查看构建日志

---

## 步骤 5: 验证 Worker 部署

```bash
# 健康检查（替换为你的 Worker URL）
curl https://go.example.com/health
```

**预期返回**：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "name": "Linketry",
    "version": "0.29.20"
  }
}
```

**测试重定向**：
```bash
# 测试一个现有的短链接
curl -I https://go.example.com/test-slug
```

应返回 301/302 状态码。

---

## 步骤 6: 部署 Admin

### 6.1 构建 Admin

**Linux/Mac**：
```bash
# 设置 API URL（替换为你的 Worker URL）
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

**Windows PowerShell**：
```powershell
# 设置 API URL
$env:VITE_LINKETRY_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

**Windows CMD**：
```cmd
# 设置 API URL
set VITE_LINKETRY_API_URL=https://go.example.com
npm run build --workspace=apps/admin
```

**预期输出**：
```
✓ built in 15s
dist/index.html                  x.xx kB
dist/assets/index-xxx.js       xxx.xx kB
```

### 6.2 部署到 Cloudflare Pages

```bash
# 部署（替换为你的 Pages 项目名称）
wrangler pages deploy apps/admin/dist --project-name=linketry-admin
```

**预期输出**：
```
✅ Deployment complete!
✅ https://linketry-admin.pages.dev
✅ https://admin.yourdomain.com (如果配置了自定义域名)
```

---

## 步骤 7: 验证 Admin 部署

### 7.1 访问 Admin

访问 Admin URL（Pages 提供的 URL 或自定义域名）

### 7.2 测试功能

- [ ] 登录成功
- [ ] 首屏加载 < 2s
- [ ] 创建链接
- [ ] 查看分析
- [ ] 页面切换流畅

### 7.3 检查性能

打开浏览器 DevTools → Network：
- [ ] 主包体积 ~400KB
- [ ] 资源并行加载
- [ ] 页面切换 < 100ms

---

## 步骤 8: 性能监控

### 8.1 实时监控

```bash
# 实时查看 Worker 日志
wrangler tail --format pretty
```

### 8.2 查看性能指标

日志中应看到：
```json
{
  "type": "metrics",
  "redirectTime": 45,
  "kvHit": true,
  "d1QueryTime": 8
}
```

### 8.3 验证索引使用

```bash
# 验证查询使用索引
wrangler d1 execute DB --remote --command \
  "EXPLAIN QUERY PLAN SELECT * FROM links WHERE domain = 'go.example.com' AND slug = 'test'"
```

**应该看到**：
```
SEARCH links USING INDEX idx_links_domain_slug
```

---

## 步骤 9: 完整验证

使用 [POST_DEPLOYMENT_CHECKLIST.md](POST_DEPLOYMENT_CHECKLIST.md) 完成完整验证。

### 关键验证项

```bash
# 1. 健康检查
curl https://go.example.com/health

# 2. 重定向性能
time curl -I https://go.example.com/popular-slug
# 应 < 50ms

# 3. KV 命中率
wrangler tail --format pretty | grep kvHit
# 应 > 85%

# 4. Admin 加载
# 打开 Admin，查看 DevTools Network
# 首屏应 < 2s
```

---

## 步骤 10: 发布公告

部署验证成功后：

1. **创建 GitHub Release**
   ```bash
   gh release create v0.29.21 \
     --title "v0.29.21: 性能优化和文档完善" \
     --notes-file DEPLOYMENT_ANNOUNCEMENT.md
   ```

2. **通知用户**（可选）
   - 发送邮件通知
   - 更新文档
   - 社交媒体发布

---

## 🚨 如遇问题

### 部署失败
1. 检查 [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. 查看详细错误日志
3. 检查网络和凭证

### 性能未达预期
1. 检查索引是否正确使用
2. 查看 KV 命中率
3. 监控 D1 查询时间

### 功能异常
1. 立即参考 [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md)
2. 执行回滚
3. 分析根本原因

---

## 📊 性能验证目标

| 指标 | 目标 | 验证方法 |
|------|------|---------|
| 热门链接重定向 | < 50ms | `time curl -I <url>` |
| D1 查询 | < 10ms | 查看日志中的 d1QueryTime |
| KV 命中率 | > 85% | 查看日志中的 kvHit |
| Admin 首屏 | < 2s | DevTools Network |
| Admin 包体积 | ~400KB | DevTools Network |

---

## ✅ 部署检查清单

- [ ] 已创建数据库备份
- [ ] 数据库迁移成功
- [ ] 10 个索引全部创建
- [ ] Worker 部署成功
- [ ] Worker 健康检查通过
- [ ] Admin 构建成功
- [ ] Admin 部署成功
- [ ] Admin 访问正常
- [ ] 重定向功能正常
- [ ] 性能指标达标
- [ ] 无错误日志
- [ ] 已完成完整验证

---

## 📚 相关文档

- [DEPLOYMENT_READINESS_REPORT.md](DEPLOYMENT_READINESS_REPORT.md) - 完整部署指南
- [POST_DEPLOYMENT_CHECKLIST.md](POST_DEPLOYMENT_CHECKLIST.md) - 验证清单
- [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) - 回滚指南
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - 故障排查

---

**🚀 逐步执行这些命令，确保每步都成功后再进行下一步！**
