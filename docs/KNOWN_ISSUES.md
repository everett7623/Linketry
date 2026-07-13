# Known Issues

跟踪当前 Linkora 未解决的 bug、限制和临时规避方案。

---

## 1. 大体积 Shlink 导入确认仍超时

- **状态**：🔴 Open
- **发现版本**：v0.9.11（异步导入 job 引入后）
- **当前版本**：v0.9.12
- **影响**：单次导入超过 ~100 条 Shlink 数据时，`POST /api/import/confirm` 仍可能触发前端 `AbortError`

### 现象

Admin 面板点击"确认导入"后，过几秒到十几秒仍弹出 `AbortError: signal is aborted without reason`。

### 根因分析

v0.9.11 把**导入写入逻辑**移到了 `ctx.waitUntil()` 后台执行，但以下步骤仍然同步运行在请求响应路径上：

1. `JSON.parse(content)`
2. `detectAdapter()`
3. `adapter.parse(input)` — 对 195 条 Shlink 记录做字段归一化、校验，可能耗时数秒到十几秒
4. `createImportJob()`
5. `recordAudit()`

前端 `apps/admin/src/api/client.ts` 有硬编码的 15 秒全局 API 超时。只要步骤 1–3 超过 15 秒，请求就会被浏览器 abort，后台的 `waitUntil` 即使继续执行，前端也收不到 `jobId`，导致导入状态不可见。

### 临时规避

- 把 Shlink 导出拆分成多个小文件（每次 < 50 条）分批导入。
- 或者直接通过 D1 SQL 批量插入。

### 修复计划

1. 将输入解析也移到后台：
   - `POST /api/import/confirm` 只接收 `content`、`source`、`filename`、`conflictStrategy`、`fieldMapping`
   - 立即创建 `status = 'pending'` 的 job，total 初始为 0
   - 通过 `ctx.waitUntil()` 在后台完成解析、校验、冲突检测和写入
2. 前端轮询 `/api/import/jobs/:id` 时，total 会从 0 逐步更新到实际数量
3. 考虑为 `confirmImport` 单独设置更长的超时，或在解析阶段流式返回早期 job 信息

### 相关文件

- `@/apps/worker/src/routes/importRoutes.ts`
- `@/apps/admin/src/api/client.ts`
- `@/apps/admin/src/pages/ImportExport.tsx`
