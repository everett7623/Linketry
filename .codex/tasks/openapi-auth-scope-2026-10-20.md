# OpenAPI auth middleware scope — 2026-10-20 (v0.33.1)

Baseline: local `main` and `origin/main` at `91a172f` (v0.33.0 deployment record); production, Demo, Admin and site at v0.33.0. The owner approved this patch release after the v0.33.0 post-deploy login probe. The H5 session (interstitial query parameters, `.codex/tasks/security-hardening-deps-2026-10-20.md` follow-up) works in its own worktree and was told to take v0.33.2 and rebase onto this release.

## Finding (KNOWN_ISSUES H6)

`apps/worker/src/routes/openapi.ts` protected its two endpoints with `routes.use('*', requireAuth(c, 'read'))`. `registerAdminApiRoutes` mounts that router first with `app.route('/api/v1', openApiRoutes)`, and Hono merges a sub-app's middleware into the parent under the mount prefix, so the guard ran for every `/api/v1/*` request before the target router:

- `POST /api/v1/auth/login` without a bearer header answered 401 `Unauthorized` and never reached the sign-in handler, its JSON validation or its rate limit; wrong tokens were therefore never rate-limited. Production on v0.33.0: a malformed body got 401 `Unauthorized` on `/api/v1/auth/login` but 400 "Invalid request body" on the legacy `/api/auth/login`, which the OpenAPI router is not mounted on.
- The Admin was unaffected: `AuthContext.login` stores the token before calling `login()`, so the request carries the same token as its bearer header.
- Every API-token request was verified twice (two `api_tokens` lookups and two `last_used_at` writes); admin-token requests paid two constant-time comparisons.
- Introduced with the OpenAPI router in `d154350` (v0.10.3).

## Change

- [x] The guard is a named `requireReadToken` middleware attached only to `GET /openapi.json` and `GET /docs`. Every other router mounted under `/api/v1` and `/api` authenticates itself (`use('*')` in each router, or inline `requireAuth` in `qrStyle`, `publicStats` and `/overview`); `auth/me` compares the admin token itself, and `auth/login` and `auth/logout` are public by design.
- [x] `apps/worker/src/routes/api.test.mjs` (registered in the Worker test list) builds the route table the way `index.ts` mounts it and sends every request through the real Worker entry (`index.ts` default export) with D1/KV doubles:
  - anonymous requests to all 216 registered `/api` method/path pairs (109 under `/api/v1`, 107 under the legacy `/api`, which has no OpenAPI routes) must answer 401 or 403, except sign-in and sign-out;
  - sign-in on `/api/v1` and `/api` returns 400 for a malformed body, 401 "Invalid token" for a wrong token and 200 for the admin token, and each attempt writes a login limiter key;
  - `GET /api/v1/tags` with an API token performs exactly one `api_tokens` lookup;
  - `/api/v1/openapi.json` and `/api/v1/docs` answer 401 anonymously and 200 with a token.

## Mutation checks

- On the v0.33.0 code (before the change): the sign-in test failed (`/api/v1` returned 401 instead of 400) and the API-token test failed (two lookups); the all-routes and OpenAPI tests passed, as the wildcard guard covered everything.
- Removing the tags router's `requireAuth`: the all-routes test listed exactly the tags routes on both prefixes (`GET 200`, `POST 400`, `PUT`/`DELETE 404`).
- Removing `requireReadToken` from the OpenAPI routes: the all-routes and OpenAPI tests listed exactly `GET /api/v1/openapi.json` and `GET /api/v1/docs` (200).
- Both files were restored and hash-checked afterwards.

## Boundaries

No redirect, cache, analytics, migration, Admin or binding change. The only behaviour changes are the reachable sign-in endpoint (and so its rate limit for failed attempts) and the single token verification.

## Validation

Local mirror of all three `ci.yml` jobs (Node 25.2.1, npm 11.15.0, Windows) after a clean `npm ci`, with the CI build variables; Playwright on ports 5183/4183:

- Deployment contracts 92/92; Demo API 6/6; site 10/10 and build.
- Worker type-check; Worker 179/179 (175 + 4).
- Admin unit 74/74.
- Admin browser suite: 42/45 on the first run after `npm ci` and 43/45 on a rerun with the default 8 local workers. The failures were first-paint and locale-switch checks (`locale-workflow` both times, `at-audit` skip-to-content, `analytics-refresh`, the i18n login locale switch) timing out while eight workers load a cold Vite dev server; this release does not touch Admin code. The two locale tests passed 8/8 repeated in isolation, and the full suite passed 45/45 with `--workers=2`, the parallelism CI uses on its 4-vCPU runners.
- Production Admin build + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3.
- Quick Deploy build and `npx wrangler deploy --dry-run`: 483.84 KiB / gzip 111.12 KiB, `LINKETRY_VERSION` 0.33.1.
- `git diff --check`: clean.

## Deployment evidence

Deployed 2026-10-20 as `54eb8cc`; live state re-checked 2026-10-21.

- Pushed `54eb8cc` to a temporary `release/v0.33.1` branch and dispatched [Validate Linketry 39379316617](https://github.com/everett7623/Linketry/actions/runs/39379316617): contracts, Worker and Admin jobs passed on Node 24.15.0, the Admin browser suite included. Fast-forwarded `main` (`91a172f..54eb8cc`); the temporary branch was deleted after checking it pointed at the same commit.
- [production 39379574281](https://github.com/everett7623/Linketry/actions/runs/39379574281): success; authenticated dispatch with `expected_release=0.33.1` and `expected_commit=54eb8cc0dd5c52f24b324f1f6a4b0bea9a6bc812`. No migration changes. The push-triggered production run `39379571252` skipped on `[skip production]`.
- [isolated Demo 39379571712](https://github.com/everett7623/Linketry/actions/runs/39379571712): success; triggered by the push.
- [project site 39379578165](https://github.com/everett7623/Linketry/actions/runs/39379578165): success; exact-commit confirmation.
- Live (2026-10-21): `go.uukk.de/health` and `demoapi.linketry.com/health` report 0.33.1; `admin.uukk.de`, `linketry-admin.pages.dev` and `demo.linketry.com` serve favicon `?v=0.33.1`; `linketry.com` `llms.txt` and JSON-LD report 0.33.1.
- Production without a token: `/api/v1/links`, `/api/v1/system/upgrade`, `/api/v1/qr-style`, `/api/v1/openapi.json`, `/api/v1/docs` and `/api/v1/auth/me` return 401; the `/health` CORS preflight returns 204; Demo `GET /api/v1/qr-style` returns 200 and `POST /api/v1/links` returns 403.
- H6 probe without a bearer header: `/api/v1/auth/login` now answers 400 "Invalid request body" for a malformed body and 401 "Invalid token" for a wrong token (it answered 401 "Unauthorized" on v0.33.0), the same as the legacy `/api/auth/login`.
- Unknown slugs: the first three probes timed out after 25 s within about two minutes, while D1-free requests on the same host (health, token rejections) answered normally; eight further probes with random slugs answered 404 in 0.91–0.99 s (TLS about 0.5 s). The timed-out probes were not split by stage, so the cause (local proxy `127.0.0.1:7897` or a D1 stall) is unconfirmed. Code fact recorded under KNOWN_ISSUES H4: the redirect path has no D1 deadline, so the KV fallback covers D1 errors but not hangs.
- Local checkout note: on 2026-10-20 between 20:54 and 20:59 (+08:00) Syncthing synced this folder with device `6VBDPWA` and left 37 untracked `*.sync-conflict-*` copies in the working tree plus copies of `.git` internals (`index`, `config`, `packed-refs`, ref logs) and a branch `main.sync-conflict-20261020-205906-6VBDPWA` at `dba6eef`. Every working-tree copy hashes to a blob already in history (the v0.32.3 state), `git fsck` reports no errors, and tracked files match `HEAD`; the copies were left in place for the owner and were not committed.
