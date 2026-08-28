# Repository Audit Fixes — 2026-08-28 (v0.31.4)

Whole-repository review; fixed the confirmed severe + important findings. No redirect-path
logic changed; Admin app unchanged.

- [x] Stream `/export/{visits.csv,links.csv,links.json,backup.json}` from D1 with keyset pagination (`getLinksPage` / `getVisitsPage`); remove `getAllVisits`; `streamBackupJson` for the download path; drop pretty-print from scheduled R2 backups
- [x] Add `utils/csv.ts` (`csvCell` / `csvRow`) with spreadsheet-formula neutralization; adopt it in `export.ts`, `export/analyticsCsv.ts`, the two `links.ts` rollback CSVs, and the async import report
- [x] Add `utils/htmlInspect.ts` (`fetchBoundedHtml`) — egress-guarded, 1 MiB byte cap regardless of `Content-Length`; use it for all three `metadata` endpoints
- [x] Add `utils/userAgent.ts`; route `analytics/index.ts` and `redirectRules/index.ts` through it (one device/browser classification; Opera fixed; iOS/Android OS labels fixed)
- [x] Export `RESERVED_PATHS` from `@linketry/shared`; Worker router imports it instead of a second hardcoded list
- [x] Make `setDefaultDomain` a single `env.DB.batch()` transaction
- [x] Delete unused `apps/worker/src/db/batch.ts` (406 lines); correct the "batch operations" claims in PROGRESS / TASKS
- [x] Correct KV / Smart-TTL description in `ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md`; mark the click-tiered TTL in `PERFORMANCE.md` as an unimplemented proposal
- [x] Add Worker tests: `utils/csv.test.mjs`, `utils/userAgent.test.mjs`, `utils/htmlInspect.test.mjs`, analytics-CSV formula-guard case; 133 Worker tests pass, Worker + Admin type-check pass
- [x] Synchronize v0.31.4 release metadata (packages, lockfile, `version.ts`, `wrangler.toml.example`, CI fallbacks, OpenAPI default, CHANGELOG, PROGRESS, TASKS, deploy docs)
- [ ] Update GitHub release approval variables and deploy v0.31.4 through the protected production / Demo / project-site workflows (owner-controlled)

## Residual (not in this batch)

- `db/index.ts` (1067 lines) and `pages/Links.tsx` (1276 lines) still exceed size thresholds — deliberate splits are separate tasks
- `Link → KVCacheEntry` conversion still has three copies (`redirect.ts`, `links.ts`, `importRoutes.ts`)
- `buildRedirectUrl` uses `.set()` for forwarded query params (visitor can override baked-in values); ROADMAP still lists strict/append/ignore modes as future work
- `recordVisitMessage` swallows errors with no `console.error`
- egress guard does not catch integer/hex IPv4 literals (`http://2130706433`); low real-world impact on the Workers runtime
