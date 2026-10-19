# Dependency and docs hygiene — 2026-10-18 (v0.32.1)

Local HEAD and fetched `origin/main` started at `58ea539` (v0.32.0) with a clean worktree. Production (`go.uukk.de`), Demo (`demoapi.linketry.com`), Admin (`admin.uukk.de`) and site (`linketry.com/llms.txt`) reported v0.32.0 before the change.

- [x] Upgrade Worker `hono` 4.12.32 → 4.13.13 (`npm install hono@^4.13.13 --workspace=apps/worker --registry=https://registry.npmjs.org`). The lockfile diff is limited to the hono entries; integrity matches `npm view hono@4.13.13 dist.integrity` on the official registry.
- [x] Point the `jsqr` 1.4.0 lockfile entry from `registry.npmmirror.com` back to `registry.npmjs.org`. The recorded integrity equals the official `dist.integrity`, so the tarball is unchanged. No mirror URLs remain.
- [x] Sync root `wrangler.jsonc` `LINKETRY_VERSION` (Quick Deploy), stuck at 0.31.0 since v0.31.0. `getRuntimeVersion` prefers `env.LINKETRY_VERSION` over the bundled constant, so Quick Deploy `/health` reported 0.31.0 (the Admin update check uses the Admin's own bundled version and was not affected). `scripts/cloudflare-one-click.test.mjs` now asserts the value equals `package.json`; the assertion failed against 0.31.0 before the fix and passes after it.
- [x] Correct production version stamps (CLAUDE, AGENTS, DEVELOPMENT, ARCHITECTURE, CONTRIBUTING: v0.31.9 → v0.32.0), align the ARCHITECTURE golden rules with the seven in AGENTS, refresh KNOWN_ISSUES H2 parity, and bring the PROGRESS Overall Status table up to v0.32.0.
- [x] Synchronize v0.32.1 package/lock/runtime versions, examples, CI fallbacks, changelog and status documents (35 literal replacements, same file set as the v0.31.13 patch).

## Why

- `npm audit --omit=dev` against the official registry reported hono ≤4.13.6 advisories. The CORS middleware ReDoS (GHSA-8j4g-w8fx-2239) triggers only when `allowHeaders` is empty. `healthCors` (`apps/worker/src/health/cors.ts`) sets none, so an unauthenticated `/health` preflight reached the quadratic parser; the `/api/*` policy (`apps/worker/src/index.ts`) lists `Content-Type, Authorization` and did not. Workers isolates serve concurrent requests on one thread, so a slow preflight could also delay redirects in the same isolate. 4.13.13 splits the header on commas and trims each entry (linear). The query-after-fragment advisory (GHSA-crvj-82cr-hjcx) affects `c.req.query()`, which Linketry uses, although HTTP clients do not normally send fragments. The rest (parseBody nesting, jsx, SSG, proxy, language, memo) cover helpers Linketry does not use. The upgrade closes all of them.
- v0.32.0 installed `jsqr` through the local npm mirror, which recorded a mirror `resolved` URL. CI and deploy workflows run `npm ci`, so releases would have depended on the mirror, against the v0.29.19 official-registry lockfile rebuild.
- Four guides still declared v0.31.9 as the production version and the status table still described v0.31.12, so agents reading them were told the wrong live version.

## Boundaries

No redirect evaluation, cache policy, analytics path, migrations, API contracts, Admin behaviour, bindings or secrets change. Production, Demo and site are not deployed by this task.

## Remaining (separate task)

`npm audit` (all dependencies, official registry) still reports 13 dev/build-time advisories (2 moderate, 11 high): the tailwindcss 3.4.19 chain (braces, chokidar, fast-glob, micromatch, postcss-nested, postcss-selector-parser) only clears with tailwindcss 4 (major migration); wrangler/miniflare (sharp, undici), nanoid via postcss, and source-map-js have non-major fixes. None of these ship in the Worker runtime bundle or the Admin static output.

## Validation

Local mirror of all three `ci.yml` jobs (Node 24.20.0, npm 11.19.0, Windows), run sequentially:

- Deployment contracts 92/92 (includes the new one-click version assertion); Demo API 6/6; project site 10/10 and production build.
- Worker type-check passed; Worker 151/151.
- Admin type-check passed; Admin unit 73/73.
- Admin browser suite (`test:smoke`, 41 tests, 12 workers): first full run 39/41, with `bulk-utm.spec.ts` (page.goto) and `ui-audit.spec.ts` (locator.click) hitting the 30 s timeout; both passed when rerun alone (3/3), and a second full run passed 41/41 in 45.8 s. No Admin source changed beyond the favicon `?v=` version.
- Production Admin build + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3; Quick Deploy `npm run build` and `npx wrangler deploy --dry-run` (bundle 481.11 KiB, gzip 109.87 KiB with hono 4.13.13).
- `npm install --package-lock-only --registry=https://registry.npmjs.org` regenerated an identical lockfile; no `npmmirror` entries remain.
- `npm audit --omit=dev --registry=https://registry.npmjs.org`: 0 vulnerabilities.
- `git diff --check`: only the pre-existing Markdown hard-break spaces on the four "Last updated" lines.

## Deployment evidence

Deployed 2026-10-19 as part of `9de314c` (v0.32.3), which also carries v0.32.1 `00caf43` and v0.32.2 `d5f2f1a`.

- Pushed `58ea539..9de314c` to `main` with the user's approval.
- [production 39181219300](https://github.com/everett7623/Linketry/actions/runs/39181219300): success; authenticated dispatch with `expected_release=0.32.3` and `expected_commit=9de314c6374f77590c7a9a36b292ea8a9d36513c`. The push-triggered production run `39181207873` skipped on `[skip production]`.
- [isolated Demo 39181207795](https://github.com/everett7623/Linketry/actions/runs/39181207795): success; triggered by the push.
- [project site 39181221970](https://github.com/everett7623/Linketry/actions/runs/39181221970): success; exact-commit confirmation.
- Live (2026-10-19): `go.uukk.de/health` and `demoapi.linketry.com/health` report 0.32.3; `admin.uukk.de`, `linketry-admin.pages.dev` and `demo.linketry.com` serve favicon `?v=0.32.3`, and the live Admin CSS (`index-C8Wli2wE.css`) contains the pinned Actions divider and the 16rem destination cap; `linketry.com` `llms.txt` and JSON-LD report 0.32.3.
- Production `/api/v1/links`, `/api/v1/system/upgrade` and `/api/v1/qr-style` return 401 without a token, an unknown slug returns 404, and the `/health` CORS preflight returns 204. Demo `GET /api/v1/qr-style` returns 200 and `POST /api/v1/links` returns 403.
