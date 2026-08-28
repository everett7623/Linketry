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
- [x] Deploy v0.31.4: production `33153940731`, Demo `33153100735` (automatic main sync), project site `33153713263`
- [x] Verify parity on `go.uukk.de`, `admin.uukk.de`, `linketry-admin.pages.dev`, `demoapi.linketry.com`, and `linketry.com`

## Deployment approval note

The production deploy ran as an authenticated `workflow_dispatch` with `expected_release=0.31.4`
and `expected_commit=62cee9e…`. `scripts/deployment-release-approval.mjs` writes those into
`GITHUB_ENV`, overriding the repository approval variables before `deploy:gate` reads them —
so a manual dispatch does not require pre-editing `LINKETRY_APPROVED_RELEASE` /
`LINKETRY_APPROVED_COMMIT`. Those variables are only authoritative on the `push` path.
`LINKETRY_APPROVED_COMMIT` therefore still points at the v0.31.3 commit; that is harmless
for dispatch deploys but must be refreshed before relying on a push-triggered production run.

## Residual (not in this batch)

- `db/index.ts` (1067 lines) and `pages/Links.tsx` (1276 lines) still exceed size thresholds — deliberate splits are separate tasks
- `Link → KVCacheEntry` conversion still has three copies (`redirect.ts`, `links.ts`, `importRoutes.ts`)
- `buildRedirectUrl` uses `.set()` for forwarded query params (visitor can override baked-in values); ROADMAP still lists strict/append/ignore modes as future work
- `recordVisitMessage` swallows errors with no `console.error`
- egress guard does not catch integer/hex IPv4 literals (`http://2130706433`); low real-world impact on the Workers runtime
