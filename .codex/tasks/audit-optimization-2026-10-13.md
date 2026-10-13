# Audit Optimization — 2026-10-13 (v0.31.6)

Local and fetched origin/main started at 6baf940, v0.31.5, with a clean worktree.

- [x] Add backup record IDs to R2 object keys to prevent same-second overwrites.
- [x] Drive link/visit CSV, link JSON, and backup streams from consumer pulls; stop subsequent queries on cancellation.
- [x] Rebuild short URLs when a restored link is renamed.
- [x] Commit domain creation, edit, deletion, and default selection together with the default-domain setting.
- [x] Guard missing domain targets and cover failure rollback with SQLite-backed tests.
- [x] Synchronize v0.31.6 package/lock/runtime versions, examples, CI fallbacks, changelog, and status documentation.

## Validation

- Worker: 145/145 tests passed (including eight new behavioural regressions).
- Admin: 67/67 unit tests passed.
- Deployment scripts: 92/92 tests passed.
- Worker and Admin TypeScript checks passed.
- Admin production build and canonical asset integrity check passed; project-site production build passed.
- Project site: 10/10 tests passed; Demo API: 6/6 tests passed.
- Admin production browser smoke passed using the installed Chrome executable (bundled Playwright browser was absent).
- No production or remote-D1 performance claims: export tests use a local SQLite adapter, and R2 tests use a consuming in-memory object store.

## Boundaries

No redirect evaluation, analytics critical path, migrations, production resource bindings, or secrets changes. Backup tag/rule/settings collections retain their existing whole-collection loading; link and visit pages now obey backpressure.

## Deployment evidence

- Source commit: `98cfef7f2d61c9ba9c907cbeb4549be6ddf80d4e`, committed and pushed to main.
- [Production workflow](https://github.com/everett7623/Linketry/actions/runs/38419840592): success; exact release and commit authenticated dispatch.
- [Isolated Demo workflow](https://github.com/everett7623/Linketry/actions/runs/38419794782): success; auto-triggered by source push.
- [Project-site workflow](https://github.com/everett7623/Linketry/actions/runs/38419847844): success; exact-commit confirmation.
- `go.uukk.de/health` and `demoapi.linketry.com/health`: HTTP 200, status ok, v0.31.6.
- `admin.uukk.de`, `linketry-admin.pages.dev`, and `demo.linketry.com`: v0.31.6 and canonical initial JS/CSS MIME verified.
- `linketry.com` JSON-LD and `/llms.txt`: v0.31.6.
- Production unauthenticated links/system APIs: HTTP 401; unknown slug: HTTP 404. Demo link creation: HTTP 403.
- Existing repository backup verification remains enabled; reviewed migration digest matches unchanged migrations. No fresh backup was created from this local session because no local production admin credential was available.
- Local Node fetch to the production API encountered ECONNRESET; curl independently verified the health and auth results. All protected workflows finished successfully.
- Status-only follow-up commit uses skip-ci/skip-production markers to avoid another deployment.
