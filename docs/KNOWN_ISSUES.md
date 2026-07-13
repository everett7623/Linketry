# Known Issues

跟踪当前 Linkora 未解决的 bug、限制和临时规避方案。

---

## 1. 大体积 Shlink 导入确认超时（已修复）

- **状态**：✅ Fixed in v0.9.13
- **发现版本**：v0.9.11（异步导入 job 引入后）
- **修复版本**：v0.9.13
- **原影响**：单次导入超过 ~100 条 Shlink 数据时，`POST /api/import/confirm` 可能触发前端 `AbortError`

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

### 原修复计划

1. 将输入解析也移到后台：
   - `POST /api/import/confirm` 只接收 `content`、`source`、`filename`、`conflictStrategy`、`fieldMapping`
   - 立即创建 `status = 'pending'` 的 job，total 初始为 0
   - 通过 `ctx.waitUntil()` 在后台完成解析、校验、冲突检测和写入
2. 前端轮询 `/api/import/jobs/:id` 时，total 会从 0 逐步更新到实际数量
3. 考虑为 `confirmImport` 单独设置更长的超时，或在解析阶段流式返回早期 job 信息

### 修复结果

- `POST /api/import/confirm` 现在先创建 `pending` job（`total_count = 0`）并立即返回。
- JSON 解析、适配器检测、字段归一化、校验和写入均在 `ctx.waitUntil()` 的异步 D1 边界之后执行。
- 后台解析完成后更新真实 `source` 和 `total_count`；解析失败会写入 `failed` 状态和 CSV 报告。
- Admin 为 confirm 使用独立的 60 秒超时，并正确显示后台失败状态、保留输入以便重试。

### 相关文件

- `@/apps/worker/src/routes/importRoutes.ts`
- `@/apps/admin/src/api/client.ts`
- `@/apps/admin/src/pages/ImportExport.tsx`

---

## 2. 大批量导入固定停在约 73 条（已修复）

- **状态**：✅ Fixed in v0.9.16
- **影响来源**：Shlink API、Shlink 文件和 Linkora CSV 等所有共用导入写入流程的来源
- **现象**：任务先显示处理中，随后只写入约 73 条；换成之前从 Linkora 导出的 CSV 仍在相同位置停止。

### 根因

v0.9.13 已让确认接口快速返回任务 ID，但后台仍逐条执行 D1 插入、标签写入和 KV 预热。约 195 条数据会产生数百次串行远程操作，超过 Cloudflare Worker `ctx.waitUntil()` 的执行窗口，因此任务在固定耗时附近被终止；“73 条”是耗时边界的表现，不是 CSV 第 74 行损坏。

### 修复结果

- 新链接按每批 25 条使用 D1 `batch()` 写入，并在每批后持久化任务进度。
- 新导入链接不再逐条预热 KV；D1 仍是事实来源，首次访问按原有重定向流程填充缓存。
- 批量事务失败时回退到逐条写入并记录具体失败项。
- 默认冲突策略仍为 `skip`，同一导入文件中的重复 slug 也不会被静默覆盖。
- 使用用户提供的 195 行 Linkora CSV 在全新本地 D1 完成验证：首次导入成功 195、失败 0；再次导入跳过 195、覆盖 0。

### 相关文件

- `@/apps/worker/src/routes/importRoutes.ts`
- `@/apps/worker/src/db/index.ts`
- `@/apps/worker/src/importers/batching.ts`
