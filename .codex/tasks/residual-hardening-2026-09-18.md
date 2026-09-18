# Residual Hardening — 2026-09-18 (v0.31.5)

Follow-up to the v0.31.4 repository audit residuals, plus a second local/remote pass.

- [x] Cap PBKDF2 iterations at 200,000 and hex payload size on `verifyLinkPassword`; reject unsupported hashes on import/restore
- [x] Move webhook URL normalization through `assertSafeEgressUrl` so private/credentialed URLs fail at save
- [x] Reuse `utils/csv` in restore reports and bulk-UTM CSVs
- [x] Share `cache/toCacheEntry` across redirect, link mutation, import, and restore
- [x] Stream R2 backups via `streamBackupJson` instead of `getAllLinks` + stringify
- [x] Log visit-accounting failures without throwing into redirect or queue ack
- [x] Admin `downloadFile`: 401 logout, Worker error body, long timeout default
- [x] Settings section picker is in-page navigation (`aria-current`), not a fake tablist
- [x] Egress guard + tests for integer/hex IPv4 literals
- [x] OpenAPI document version is required at the call site
- [x] Synchronize v0.31.5 release metadata
- [ ] Deploy v0.31.5 through protected production / Demo / project-site workflows

## Intentionally not in this batch

- Redirect query forwarding still uses `.set()` (visitor values win); documented as UTM forwarding in ARCHITECTURE / SHLINK_FEATURE_GAP
- Unique-click TOCTOU under concurrent same-IP hits would need a D1 uniqueness contract; left alone on the analytics path
- `db/index.ts` and `pages/Links.tsx` size splits remain separate tasks
- Screen-reader AT, fresh-account Quick Deploy rehearsal, remote-D1 scale evidence, and Demo R2 remain operator gates
