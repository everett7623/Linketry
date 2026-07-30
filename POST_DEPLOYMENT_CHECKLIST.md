# 部署后验证清单

部署完成后，请按照此清单验证所有功能和性能。

---

## ✅ 基础功能验证

### 1. 健康检查

```bash
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

- [ ] 健康检查返回正常
- [ ] 版本号正确

### 2. 重定向功能

```bash
# 测试重定向
curl -I https://go.example.com/test-slug
```

**验证**：
- [ ] 返回 301 或 302 状态码
- [ ] Location header 正确
- [ ] 响应时间 < 100ms

### 3. Admin 访问

访问 Admin URL 并测试：
- [ ] 登录成功
- [ ] 首屏加载 < 2s
- [ ] 页面切换流畅
- [ ] 所有功能正常

---

## 📊 性能验证

### 1. 重定向性能

```bash
# 测试热门链接
time curl -I https://go.example.com/popular-slug

# 测试冷门链接
time curl -I https://go.example.com/new-slug
```

**目标**：
- [ ] 热门链接 < 50ms
- [ ] 冷门链接 < 120ms
- [ ] 平均响应 < 100ms

### 2. 索引使用验证

```bash
wrangler d1 execute DB --remote --command \
  "EXPLAIN QUERY PLAN SELECT * FROM links WHERE domain = 'go.example.com' AND slug = 'test'"
```

**预期**：
```
SEARCH links USING INDEX idx_links_domain_slug
```

- [ ] 查询使用索引
- [ ] 索引名称正确

### 3. KV 命中率监控

```bash
# 实时监控日志
wrangler tail --format pretty
```

**观察指标**：
- [ ] 看到 `kvHit: true` 的比例
- [ ] 目标命中率 > 85%

### 4. Admin 加载性能

打开浏览器 DevTools → Network：
- [ ] 首屏加载 < 2s
- [ ] 主包体积 ~400KB
- [ ] 资源并行加载
- [ ] 页面切换 < 100ms

---

## 🔍 数据库验证

### 1. 验证索引创建

```bash
wrangler d1 execute DB --remote --command \
  "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
```

**预期看到 10 个索引**：
- [ ] idx_links_domain_slug
- [ ] idx_links_clicks
- [ ] idx_visits_link_created
- [ ] idx_visits_country_device
- [ ] idx_visits_created_link
- [ ] idx_links_domain_created
- [ ] idx_links_tags
- [ ] idx_links_expires_at
- [ ] idx_audit_logs_created
- [ ] idx_import_jobs_status_created

### 2. 验证表结构

```bash
wrangler d1 execute DB --remote --command \
  "PRAGMA table_info(links)"
```

**验证**：
- [ ] 所有列存在
- [ ] 类型正确

### 3. 数据完整性

在 Admin 中验证：
- [ ] 所有链接可见
- [ ] 点击数正确
- [ ] 标签正常
- [ ] 分析数据完整

---

## 📈 监控验证

### 1. 性能日志

```bash
wrangler tail --format pretty | grep metrics
```

**预期看到**：
```json
{
  "type": "metrics",
  "redirectTime": 45,
  "kvHit": true,
  "d1QueryTime": 8
}
```

- [ ] 看到性能指标日志
- [ ] 指标值合理
- [ ] 无错误日志

### 2. 告警测试

创建一个慢查询，验证告警：
- [ ] 看到 WARNING 或 CRITICAL 日志
- [ ] 告警信息清晰

---

## 🧪 功能测试

### 1. CRUD 操作

**创建链接**：
- [ ] 创建成功
- [ ] 立即可访问
- [ ] 缓存生效

**更新链接**：
- [ ] 更新成功
- [ ] 缓存更新
- [ ] 重定向正确

**删除链接**：
- [ ] 删除成功
- [ ] 缓存清除
- [ ] 返回 404

### 2. 批量操作

**导入**：
- [ ] 导入成功
- [ ] 性能提升明显
- [ ] 数据准确

**导出**：
- [ ] 导出成功
- [ ] 数据完整

### 3. 分析功能

- [ ] 访问统计正确
- [ ] 图表显示正常
- [ ] 时间范围过滤有效
- [ ] 维度分析准确

---

## ⚠️ 错误检查

### 1. 错误日志

```bash
wrangler tail --format pretty | grep -i error
```

- [ ] 无关键错误
- [ ] 无异常堆栈

### 2. 控制台错误

打开浏览器 Console：
- [ ] 无 JavaScript 错误
- [ ] 无网络错误
- [ ] 无警告信息

### 3. 边界情况

测试边界情况：
- [ ] 不存在的 slug → 404
- [ ] 禁用的链接 → 禁用页面
- [ ] 过期的链接 → 过期页面
- [ ] 达到点击限制 → 正确处理

---

## 🔐 安全验证

### 1. 认证

- [ ] 未认证访问 API → 401
- [ ] 错误 token → 401
- [ ] 正确 token → 200

### 2. 权限

- [ ] Demo 模式限制正常
- [ ] 危险操作需确认
- [ ] 审计日志记录

---

## 📊 性能基准

收集以下指标，与优化前对比：

### 重定向性能
```
热门链接平均时间：_____ ms
冷门链接平均时间：_____ ms
P95 重定向时间：_____ ms
P99 重定向时间：_____ ms
```

### KV 命中率
```
1 小时内：_____ %
24 小时内：_____ %
7 天内：_____ %
```

### Admin 性能
```
首屏加载时间：_____ s
主包体积：_____ KB
页面切换时间：_____ ms
```

### D1 查询
```
平均查询时间：_____ ms
使用索引比例：_____ %
```

---

## 🎯 成功标准

所有项目必须满足：

### 必须满足（P0）
- [x] 健康检查正常
- [x] 重定向功能正常
- [x] Admin 可访问
- [x] 数据完整性
- [x] 无关键错误

### 应该满足（P1）
- [x] 热门链接 < 50ms
- [x] D1 查询使用索引
- [x] KV 命中率 > 85%
- [x] Admin 加载 < 2s
- [x] 性能日志正常

### 期望满足（P2）
- [x] 所有性能目标达成
- [x] 无任何告警
- [x] 批量操作性能提升明显

---

## 📝 问题记录

如发现问题，记录以下信息：

### 问题描述
```
问题：
复现步骤：
预期结果：
实际结果：
```

### 环境信息
```
版本：
浏览器：
网络：
时间：
```

### 日志
```
错误日志：
性能指标：
其他信息：
```

---

## ✅ 验证完成

所有检查项完成后：

- [ ] 所有 P0 项目通过
- [ ] 大部分 P1 项目通过
- [ ] 已记录所有问题
- [ ] 已收集性能数据

**验证人**：___________  
**验证时间**：___________  
**结论**：✅ 通过 / ⚠️ 有问题 / ❌ 失败

---

## 📊 性能报告

验证完成后，填写性能对比报告：

| 指标 | 优化前 | 优化后 | 实际提升 | 预期提升 | 达成率 |
|------|--------|--------|---------|---------|--------|
| 热门链接重定向 | ___ ms | ___ ms | ___ % | 60% | ___ % |
| D1 查询时间 | ___ ms | ___ ms | ___ % | 80-90% | ___ % |
| KV 命中率 | ___ % | ___ % | +___ % | +15-25% | ___ % |
| Admin 首屏 | ___ s | ___ s | ___ % | 40-50% | ___ % |
| Admin 包体积 | ___ KB | ___ KB | ___ % | 50% | ___ % |

**总体评价**：___________

---

**验证完成！如有问题请查看 [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**
