# 回滚指南

如果部署后出现问题，请按照此指南进行回滚。

---

## ⚠️ 何时回滚

### 立即回滚的情况

- 🔴 **重定向功能完全失败**
- 🔴 **大量 5xx 错误**
- 🔴 **数据丢失或损坏**
- 🔴 **性能严重下降（> 50%）**
- 🔴 **关键功能不可用**

### 评估后回滚的情况

- 🟡 **性能未达预期但仍可用**
- 🟡 **部分非关键功能异常**
- 🟡 **监控显示异常但影响有限**

### 无需回滚的情况

- 🟢 **小的 UI 问题**
- 🟢 **文档错误**
- 🟢 **监控日志格式问题**
- 🟢 **非关键告警**

---

## 🔄 回滚步骤

### 方案 A：快速回滚（推荐）

**适用场景**：Worker 或 Admin 代码问题

#### 1. 回滚 Worker

```bash
# 查看部署历史
wrangler deployments list

# 输出示例：
# Created:              ID:                  Version:
# 2026-07-30 18:00:00   abc123def456        v0.29.20
# 2026-07-30 12:00:00   xyz789uvw012        v0.29.18  ← 回滚到这个

# 回滚到上一个版本
wrangler rollback --message "Rollback due to [具体原因]"
```

**预期输出**：
```
✅ Rollback successful
✅ Now serving version: v0.29.18
```

**验证**：
```bash
curl https://go.example.com/health
# 应返回 v0.29.18
```

**耗时**：~30 秒

#### 2. 回滚 Admin

```bash
# 在 Cloudflare Pages 控制台
# 1. 访问 https://dash.cloudflare.com
# 2. 进入 Workers & Pages → linketry-admin
# 3. 点击 Deployments
# 4. 找到之前的部署
# 5. 点击 "..." → "Rollback to this deployment"
```

**验证**：
- 访问 Admin URL
- 检查版本和功能

**耗时**：~1 分钟

---

### 方案 B：完整回滚

**适用场景**：需要同时回滚所有组件

#### 1. 准备工作

```bash
# 确认当前状态
git status
git log --oneline -5

# 确认目标版本
git log --oneline | grep "v0.29.18"
```

#### 2. 创建回滚分支

```bash
# 基于上一个稳定版本创建回滚分支
git checkout -b rollback/to-v0.29.18 <commit-hash>

# 推送回滚分支
git push origin rollback/to-v0.29.18
```

#### 3. 回滚 Worker

```bash
# 从回滚分支部署
git checkout rollback/to-v0.29.18
npm run deploy --workspace=apps/worker
```

#### 4. 回滚 Admin

```bash
# 构建上一个版本
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin

# 部署
wrangler pages deploy apps/admin/dist --project-name=linketry-admin
```

**耗时**：~5 分钟

---

### 方案 C：数据库回滚（谨慎）

**⚠️ 警告**：通常不需要回滚数据库索引，因为它们只会提升性能。

**如果必须删除索引**：

```bash
# 删除单个索引
wrangler d1 execute DB --remote --command \
  "DROP INDEX IF EXISTS idx_links_domain_slug"

# 删除所有新索引
wrangler d1 execute DB --remote --command \
  "DROP INDEX IF EXISTS idx_links_domain_slug;
   DROP INDEX IF EXISTS idx_links_clicks;
   DROP INDEX IF EXISTS idx_visits_link_created;
   DROP INDEX IF EXISTS idx_visits_country_device;
   DROP INDEX IF EXISTS idx_visits_created_link;
   DROP INDEX IF EXISTS idx_links_domain_created;
   DROP INDEX IF EXISTS idx_links_tags;
   DROP INDEX IF EXISTS idx_links_expires_at;
   DROP INDEX IF EXISTS idx_audit_logs_created;
   DROP INDEX IF EXISTS idx_import_jobs_status_created"
```

**注意**：
- 删除索引**不会**删除数据
- 删除索引**可能**降低性能
- 建议只回滚 Worker/Admin，保留索引

**耗时**：~30 秒

---

## 📋 回滚检查清单

### 回滚前

- [ ] 确认问题严重程度
- [ ] 记录当前状态和错误日志
- [ ] 通知相关人员
- [ ] 确认回滚目标版本
- [ ] 准备好验证步骤

### 回滚中

- [ ] 执行回滚命令
- [ ] 观察回滚过程
- [ ] 记录回滚日志

### 回滚后

- [ ] 验证健康检查
- [ ] 测试关键功能
- [ ] 检查性能指标
- [ ] 确认问题已解决
- [ ] 更新状态通告

---

## 🔍 验证回滚成功

### 1. 基础验证

```bash
# 健康检查
curl https://go.example.com/health
# 应返回上一个版本号

# 测试重定向
curl -I https://go.example.com/test-slug
# 应返回 301/302

# Admin 访问
# 打开 Admin URL，应能正常登录
```

### 2. 功能验证

- [ ] 所有重定向正常
- [ ] Admin 所有功能可用
- [ ] 数据完整无损
- [ ] 无新错误日志

### 3. 性能验证

```bash
# 监控日志
wrangler tail --format pretty
```

- [ ] 响应时间恢复正常
- [ ] 无异常告警
- [ ] 错误率恢复正常

---

## 📊 回滚后分析

### 问题分析

回滚后，需要分析根本原因：

1. **收集证据**
   ```bash
   # 导出回滚前的日志
   wrangler tail --format json > rollback-logs.json
   
   # 保存错误截图
   # 记录性能指标
   ```

2. **根因分析**
   - 问题首次出现时间
   - 受影响的功能
   - 错误日志和堆栈
   - 性能指标变化
   - 用户报告

3. **记录学习**
   ```markdown
   ## 回滚报告
   
   **回滚时间**：2026-07-30 20:00
   **回滚原因**：[具体原因]
   **受影响范围**：[范围]
   **根本原因**：[分析]
   **预防措施**：[措施]
   ```

### 修复计划

1. **修复问题**
   - 在本地复现
   - 编写测试用例
   - 修复并验证
   - 更新文档

2. **重新部署**
   - 更充分的测试
   - 更小的变更范围
   - 更密切的监控
   - 准备好快速回滚

---

## 🚨 紧急联系

### 回滚决策链

1. **技术负责人**：评估问题严重程度
2. **运维负责人**：执行回滚操作
3. **产品负责人**：决定是否通知用户

### 通知模板

**内部通知**：
```
🚨 紧急回滚通知

时间：2026-07-30 20:00
版本：v0.29.20 → v0.29.18
原因：[具体原因]
影响：[受影响范围]
状态：回滚完成/进行中

详情：[链接]
```

**用户通知**（如需要）：
```
📢 服务通知

我们检测到服务异常，已临时回滚到上一个稳定版本。
- 所有功能已恢复正常
- 数据安全未受影响
- 我们正在修复问题

感谢您的理解！
```

---

## 📈 回滚统计

### 回滚记录

| 日期 | 版本 | 原因 | 影响 | 恢复时间 |
|------|------|------|------|---------|
| - | - | - | - | - |

### 回滚指标

```
总部署次数：___
回滚次数：___
回滚率：____%
平均回滚时间：___分钟
```

---

## 💡 回滚最佳实践

### 预防回滚

1. **充分测试**
   - 本地测试 ✅
   - 集成测试 ✅
   - 性能测试 ✅
   - 负载测试 ⚠️

2. **渐进部署**
   - 先部署到测试环境
   - 灰度发布（如支持）
   - 监控指标变化
   - 用户反馈收集

3. **完善监控**
   - 实时性能监控
   - 错误告警
   - 用户行为分析

### 快速回滚

1. **自动化**
   - 一键回滚脚本
   - 自动化验证
   - 自动化通知

2. **文档化**
   - 清晰的回滚步骤
   - 常见问题处理
   - 联系方式明确

3. **演练**
   - 定期回滚演练
   - 验证回滚流程
   - 优化回滚时间

---

## 🔗 相关资源

- [部署就绪报告](DEPLOYMENT_READINESS_REPORT.md)
- [部署后验证清单](POST_DEPLOYMENT_CHECKLIST.md)
- [故障排查指南](docs/TROUBLESHOOTING.md)
- [性能优化指南](docs/PERFORMANCE.md)

---

## 📞 获取帮助

如果回滚过程遇到问题：

1. 查看 [故障排查指南](docs/TROUBLESHOOTING.md)
2. 检查 Cloudflare 状态页
3. 提交 GitHub Issue
4. 联系技术支持

---

**记住：快速回滚比完美修复更重要！先恢复服务，再分析问题。**
