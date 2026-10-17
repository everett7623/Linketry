# Admin locale split and QR reload hint — 2026-10-17

## Scope and source

- At batch-1 preparation, local `main` equaled `origin/main` (`f265abe`, v0.31.7 deployed). This record covers batch 1 and its subsequent Demo test fix.
- Initial patch version: `0.31.8`, subsequently deployed as recorded below. Follow-up version: `0.31.9`. Redirect logic, Worker behaviour, D1/KV, migrations and Demo isolation untouched.

## Changes

1. **On-demand Simplified Chinese catalog.** Every `src/i18n/*Messages.ts` previously held both `en` and `zh-CN`, and `messages.ts` merged both into the entry chunk. English stays in the original files (default locale, fallback and `MessageKey` type source); Chinese moved to `src/i18n/zh-CN/` and is reached only through `loadCatalog()`'s dynamic import. `zh-CN/index.ts` uses `satisfies MessageCatalog`, so a missing key fails type-checking.
2. **First paint.** `main.tsx` awaits the stored locale's catalog before rendering; `LocaleProvider` falls back to English if loading fails and switches `locale` only after the target catalog is available.
3. **Test-only aggregate.** `src/i18n/allMessages.ts` re-exports both locales for Playwright specs and unit tests; application code never imports it.
4. **QR reload hint.** The dynamic `qrcode` import and QR rendering are separate try blocks; a failed module fetch shows `qrModuleUnavailable` (reload and retry) instead of `qrFailed`.
5. **Deliberately skipped:** lazy `VersionCenterDialog`. It is about 12 kB raw (about 3 kB gzip) and a failed lazy chunk would surface through the root error boundary in the historically fragile upgrade flow.

## Measurements (production build)

| Asset | Before | After |
|-------|--------|-------|
| Entry `index-*.js` | 155.6 kB / 50.9 kB gzip | 114.6 kB / 36.5 kB gzip |
| Chinese catalog chunk | (in entry) | 41.3 kB / 15.9 kB gzip, loaded only for `zh-CN` |

Verified the entry contains no Chinese catalog strings, the Chinese chunk contains no English strings, and the entry references the Chinese chunk.

## Validation

- Admin TypeScript check passes; Admin unit tests 68/68 (adds on-demand catalog load/cache test).
- Full Admin browser suite 32/32 with Playwright Chromium 1234, including English/Chinese core workflows and locale persistence.
- Production-build smoke 2/2, including a new check that a stored `zh-CN` login page never renders English `Sign In`. Mutation-checked: rendering before the catalog loads makes this test fail.
- Admin production build and canonical asset integrity pass.

## v0.31.8 deployment

- Owner authorized commit, push and deployment on 2026-10-17. Source `53c806722bf409b9de5a7872586ff0519f3c03e6`.
- [Production run 39011511790](https://github.com/everett7623/Linketry/actions/runs/39011511790): success (authenticated exact-release/exact-commit dispatch).
- [Site run 39011514606](https://github.com/everett7623/Linketry/actions/runs/39011514606): success.
- Live: `go.uukk.de/health` ok v0.31.8; `admin.uukk.de` and `linketry-admin.pages.dev` advertise v0.31.8; `linketry.com/llms.txt` reports 0.31.8.
- [Demo run 39011483517](https://github.com/everett7623/Linketry/actions/runs/39011483517): **failure** in "Test isolated Demo Admin build", before any Cloudflare write. Demo stayed on v0.31.7.

## v0.31.9 fix

- Root cause: the new first-paint test waited for the production `Sign In` button. Public Demo builds (`VITE_LINKETRY_DEMO_MODE=read-only`) render `Enter Demo` instead. The application behaviour was correct; the test assumed the production build mode.
- Fix: the test reads both submit labels from the catalogs and accepts either; the English-flash check watches both English labels.
- Verified locally: production-build smoke 2/2 against a Demo-mode build and 2/2 against a production build.
- Owner rule recorded: every fix ships with its own version bump.

## Remaining

- v0.31.9 deployment and parity complete; evidence below.
- Batches 2–4: `Links.tsx` split, visual audit report, branded QR design.

## v0.31.9 baseline and release validation

- Fetched origin again before release. Local HEAD and origin/main both equal `53c806722bf409b9de5a7872586ff0519f3c03e6`; `git show origin/main:package.json` reports v0.31.8. Existing uncommitted v0.31.9 changes were preserved and reviewed against that exact baseline; no reset or downgrade occurred.
- Rechecked failed Demo logs: its Chinese first-render test searched for the production `登录` button and timed out.
- Re-ran actual Demo-mode (`VITE_LINKETRY_DEMO_MODE=true`, matching workflow) build: production browser smoke 2/2 pass. Rebuilt normal production: production browser smoke 2/2 pass. Both builds pass TypeScript and canonical asset integrity.
- Admin unit 68/68; deployment-policy 92/92; Worker type-check passes. Migration digest unchanged (`54bf95ca42735b85e17f109766db9c1005a1d851f8d4ec25d880cff8ca92da2f`).
- Release continues through exact-commit production/site dispatch and isolated Demo main-push synchronization. Existing backup verification remains configured; no fresh backup claimed.

## v0.31.9 deployment evidence

- Source `2e9f59fe39fed4a4ce2b231a764c00581d98db6e` directly descends from remote v0.31.8 `53c806722bf409b9de5a7872586ff0519f3c03e6`. Committed and pushed without discarding existing local work.
- [Production](https://github.com/everett7623/Linketry/actions/runs/39012101980), [Demo](https://github.com/everett7623/Linketry/actions/runs/39012101897), and [site](https://github.com/everett7623/Linketry/actions/runs/39012103848): all success.
- Production/Demo health HTTP 200, status ok, v0.31.9. Production Admin, Pages origin and Demo Admin v0.31.9; canonical JS/CSS and preload assets return HTTP 200 with correct MIME.
- Site JSON-LD and llms.txt report v0.31.9. Production unauthenticated links/system APIs 401; missing slug 404; Demo create-link request 403.
- AGENTS now explicitly requires fetch, local/remote version/SHA/dirty-state comparison, preservation of local changes, and integration of new remote commits before publishing.
- Status-only follow-up uses skip-ci/skip-production markers.

## v0.31.10 re-review fix

- Baseline: fetched origin; local HEAD and `origin/main` both `969c548`, package version 0.31.9, no uncommitted changes before this work. No remote branches or open PRs beyond the stale July branches.
- Finding (P2, introduced in v0.31.8): `main.tsx` awaited the stored locale's dynamic import with no bound. Reproduced against the production build with a stored `zh-CN` locale: normal → Chinese login; aborted chunk → English login (intended fallback); **never-answered chunk → `#root` still empty after 6 s**.
- Fix: first paint races the catalog against a 3 s timeout, then renders; `loadCatalog` shares one in-flight promise so `LocaleProvider` switches to Chinese when the same request resolves.
- Regression: unit test asserts concurrent loads share one promise; production-build smoke adds a stalled-catalog case. Mutation-checked: the new case fails against the v0.31.9 build and passes after the fix.
- Validation: production-build smoke 3/3 (production and Demo-mode builds), Admin unit 68/68, TypeScript, full Admin browser suite 32/32.
- Deployment: pre-push fetch confirmed HEAD = `origin/main` = `969c548`. Source `cf5ef55260d424658544ec581ede7b3eeeafee2a`; [production 39018888232](https://github.com/everett7623/Linketry/actions/runs/39018888232), [Demo 39018879375](https://github.com/everett7623/Linketry/actions/runs/39018879375) and [site 39018890140](https://github.com/everett7623/Linketry/actions/runs/39018890140) all succeeded.
- Live: production/Demo health ok v0.31.10; `admin.uukk.de`, `linketry-admin.pages.dev`, `demo.linketry.com` and `llms.txt` report 0.31.10; production links/upgrade APIs 401, unknown slug 404, Demo create-link 403. Production and Demo entry bundles contain the 3 s timeout; the Chinese catalog chunk returns 200 `application/javascript` with Chinese content.
- Other review notes, not changed: commit `2e9f59f` uses an English subject (history on `main` is not rewritten); a tab opened before a deployment that changes Chinese strings falls back to English if the user switches language (same class as the QR reload hint); the Chinese chunk is emitted as `index-*.js`, which is easy to confuse with the entry when reading build output.

## v0.31.11 batch 2 — Links page split

- Baseline: fetched origin; local HEAD and `origin/main` both `5541a4d` (v0.31.10 status record); clean tree.
- `pages/Links.tsx` 1282 → 507 lines. New `components/links/`: `LinkTable` (279), `LinkFilterBar` (63), `LinkAdvancedFilters` (148), `LinkBulkActionBar` (94), `LinkConfirmDialogs` (83), `BulkTagModal` (88), `BulkUrlReplaceModal` (125), `DomainMigrationModal` (135), `QrCodeModal` (57). All API calls still go through `src/api/links.ts`; markup, labels and classes unchanged.
- Dialog state: the tag and domain migration dialogs mount only while open, which reproduces the old explicit reset-on-open (tag mode `add` + empty input; source = current domain filter, target = default domain). The URL replace dialog stays mounted so its find/replace text survives reopening, as before. `Modal` already returns `null` when closed and restores focus in its effect cleanup, so unmounting keeps Escape focus return (existing migration focus test still passes).
- Intentional small differences: each dialog now has its own busy state instead of the page-wide `actionLoading`, so the bulk bar buttons behind an open dialog no longer show a spinner; switching Simple → Advanced mode while URL replace text is typed now clears it (the dialog is only mounted in Advanced mode).
- Validation: TypeScript, Vite build (Links chunk 38.3 kB / 9.6 kB gzip), Admin unit 68/68, browser 33/33 (new dialog test), production-build smoke 3/3. New test mutation-checked: making the URL replace dialog unmount on close fails it at the persisted-text assertion.
