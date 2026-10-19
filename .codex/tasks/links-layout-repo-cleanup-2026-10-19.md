# Links layout and repository cleanup — 2026-10-19 (v0.32.3)

Baseline: local `main` at `00caf43` (v0.32.1, not pushed); `origin/main` at `58ea539` (v0.32.0); v0.32.2 (toolchain advisories, `.codex/tasks/toolchain-advisories-2026-10-18.md`) prepared in the dependency session's worktree and not yet committed. Production, Demo, Admin and site report v0.32.0. The two change sets touch no common files.

- [x] Remove 15 tracked leftovers from PR #18 (added 2026-07-29/30) at the repository root: `ALL_TASKS_FINAL_REPORT.md`, `FINAL_COMPLETION_SUMMARY.md`, `PROJECT_COMPLETION_SUMMARY.md`, `DOCS_CONSISTENCY_AUDIT.md`, `DOCS_UNIFICATION_REPORT.md`, `SHORT_TERM_OPTIMIZATION_REPORT.md`, `OPTIMIZATION_PLAN.md`, `DEPLOYMENT_READINESS_REPORT.md`, `DEPLOYMENT_ANNOUNCEMENT.md`, `POST_DEPLOYMENT_CHECKLIST.md`, `ROLLBACK_GUIDE.md`, `DEPLOYMENT_COMMANDS.md`, `PULL_REQUEST_TEMPLATE.md`, `deploy.sh`, `worktree.diff`. They referenced only each other. Three were actively harmful: GitHub uses a root `PULL_REQUEST_TEMPLATE.md`, so every new PR was pre-filled with the v0.29.20 description; `deploy.sh` ran remote D1 migrations, `d1 execute --remote`, Worker and Pages deploys outside the protected workflows and their gates; `ROLLBACK_GUIDE.md` instructed remote `DROP INDEX`. Kept: `CUTOVER.md`, `DEPLOYMENT.md`, `SECURITY.md`, `SUPPORT.md` (referenced by maintained docs or tests) and `DEVELOPMENT_GUIDE.md` (maintained through v0.31.2).
- [x] `docs/PRODUCT_GAP_AUDIT.md`: live version v0.31.3 → v0.32.0.
- [x] Links table at 1440 px (visual audit P2): the Actions column is pinned to the right edge (`sticky right-0`, opaque background, an inset divider in the row-divider colour, and an overlay that re-applies the row hover tint); short-link badges may wrap under long slugs; the destination cap drops from 20rem to 16rem (full URL stays in the tooltip); created dates and the Actions header no longer wrap.
- [x] Links on phones (visual audit P2): with no stored view preference, screens below `md` (767 px) open in card view (`defaultLinkView` / `isNarrowLinkViewport` in `utils/linkView.ts`); a stored table or card choice still wins. Advanced filters start collapsed below `md` behind a disclosure button (`aria-expanded`, `aria-controls`) that shows how many filters are active (new `advancedFiltersActive` key, en and zh-CN); from `md` up the fields are always shown and the toggle is hidden.
- [x] Tests: `apps/admin/tests/links-layout.spec.ts` (4 browser tests) and a linkView unit test for the narrow default and stored-preference precedence. Mutation check: 3 of the 4 browser tests failed against the previous code (Actions header only 46 % visible; table instead of cards on a phone; no filter toggle), and the desktop non-regression test passed both before and after.
- [x] Local cleanup (outside the repository): deleted local branches `main.sync-conflict-20260714-214832-6VBDPWA`, `codex/linkora-0.8.0-release`, `release/v0.29.20` and `codex/linketry-0.29.15-release`; dropped the 2026-07-23 stash ("pre-pull local 0.29.4 recovery work"); removed five Syncthing `*.sync-conflict-*` copies under `.git`; deleted three `refs/codex/turn-diffs/...` refs whose paths exceeded the Windows limit (`git fetch` no longer errors). SHAs and the stash patch were saved in the session scratchpad first.
- [x] Remote cleanup: deleted the merged branches `codex/admin-hashed-cache-readiness` (#12), `codex/admin-module-identity-recovery` (#11) and `codex/linketry-0.29.15-release` (#13), all squash-merged with branch head = PR head, plus `codex/site-beginner-deployment` and `release/v0.29.20` (#18), both contained in `main`. `origin` now has only `main`.

## Measurements

Representative 20-link dataset (long slugs and URLs, CJK titles, three-tag sets, source badges, password and warning markers, expiry and click limits), Advanced mode, dark theme unless noted:

| Viewport | Before | After |
|---|---|---|
| 1440×900, table | overflow 144 px; Actions header 144 px and the first delete button 128 px past the container; created dates on two lines | overflow 0 px; Short Link 204 → 110 px, Destination 320 → 256 px; delete button 16 px inside; dates on one line |
| 1280×800, light, table | — | overflow 158 px with this dataset; Actions stay visible behind the divider, hover tint intact, the rest scrolls |
| 390×844, no stored view | table (938 px sideways scroll); first result at 876 px, below the 844 px fold | cards; advanced fields collapsed; first result at 479 px |

The "Short Link" header now wraps to two lines at 1440 px with long slugs; forcing it onto one line would push this dataset 17 px past the container, so the wrap is accepted.

## Boundaries

No Worker, redirect, cache, API, migration or stored-data change. Desktop keeps the table default and the always-open advanced filters.

## Validation

Local mirror of all three `ci.yml` jobs (Node 24.20.0, npm 11.19.0, Windows) on the uncommitted change set over `00caf43`, run sequentially:

- Deployment contracts 92/92; Demo API 6/6; project site 10/10 and production build.
- Worker type-check passed; Worker 151/151.
- Admin type-check passed; Admin unit 74/74 (one new linkView test).
- Admin browser suite (`test:smoke`): 45/45 on the first full run in 43.5 s (41 existing + 4 new).
- Production Admin build + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3.
- Quick Deploy `npm run build` and `npx wrangler deploy --dry-run`: 481.11 KiB / gzip 109.87 KiB, the same as v0.32.1 (no Worker change).
- `git diff --check`: clean.
- Re-run on the merged state (v0.32.2 toolchain from `d5f2f1a`: wrangler 4.151.1, postcss 8.5.30; plus this change set at v0.32.3), all 14 steps green: deployment 92/92, Demo API 6/6, site 10/10 and build, Worker type-check and 151/151, Admin unit 74/74, Admin browser 45/45 on the first run (55.6 s), production and Demo builds with `test:production` 3/3 each, Quick Deploy build and Worker dry run 481.11 KiB / gzip 109.87 KiB.
- Screenshots before and after (1440 dark, 1280 light with hover and scrolled, 390 en, 390 zh-CN with an active-filter count) were reviewed in the session scratchpad; they are not committed.

## Release

- With the user's approval (2026-10-19) the dependency session committed v0.32.2 as `d5f2f1a` on `claude/funny-cray-3062ea` (parent `00caf43`, 29 files, no trailers), and local `main` was fast-forwarded to it with this change set still uncommitted; the two touched no common files. `npm ci --registry=https://registry.npmjs.org` then installed the merged lockfile (wrangler 4.151.1, postcss 8.5.30, hono 4.13.13) without changing it.
- Synchronized v0.32.3: 36 literal replacements in the v0.32.2 file set (package manifests, lockfile workspace entries, `version.ts`, root `wrangler.jsonc`, Wrangler example, workflow fallbacks, deployment docs, guide headers and examples, Admin favicon, site JSON-LD and `llms.txt`), plus CHANGELOG, PROGRESS, TASKS and the guide "Last updated" dates.

## Deployment evidence

Deployed 2026-10-19 as part of `9de314c` (v0.32.3), which also carries v0.32.1 `00caf43` and v0.32.2 `d5f2f1a`.

- Pushed `58ea539..9de314c` to `main` with the user's approval.
- [production 39181219300](https://github.com/everett7623/Linketry/actions/runs/39181219300): success; authenticated dispatch with `expected_release=0.32.3` and `expected_commit=9de314c6374f77590c7a9a36b292ea8a9d36513c`. The push-triggered production run `39181207873` skipped on `[skip production]`.
- [isolated Demo 39181207795](https://github.com/everett7623/Linketry/actions/runs/39181207795): success; triggered by the push.
- [project site 39181221970](https://github.com/everett7623/Linketry/actions/runs/39181221970): success; exact-commit confirmation.
- Live (2026-10-19): `go.uukk.de/health` and `demoapi.linketry.com/health` report 0.32.3; `admin.uukk.de`, `linketry-admin.pages.dev` and `demo.linketry.com` serve favicon `?v=0.32.3`, and the live Admin CSS (`index-C8Wli2wE.css`) contains the pinned Actions divider and the 16rem destination cap; `linketry.com` `llms.txt` and JSON-LD report 0.32.3.
- Production `/api/v1/links`, `/api/v1/system/upgrade` and `/api/v1/qr-style` return 401 without a token, an unknown slug returns 404, and the `/health` CORS preflight returns 204. Demo `GET /api/v1/qr-style` returns 200 and `POST /api/v1/links` returns 403.
