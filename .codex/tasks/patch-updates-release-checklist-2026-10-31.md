# Patch updates and release checklist — 2026-10-31 (v0.34.1)

Baseline:

- `origin/main` and local `main` were both at `cc3e75d`, the v0.34.0 deployment record. Production, Demo and site were on v0.34.0, and the working tree was clean.
- At 06:17 and 06:18 UTC the owner's account dispatched two production runs on `cc3e75d`: `41175993899` and `41176027902`. Both succeeded; neither was started from this session.
- `cc3e75d` changes only Markdown on top of `a3cc818`. After both runs, production and Demo `/health` still reported 0.34.0, and `admin.uukk.de` still served the same `index-qBmuQgde.css`.

## GitHub Release

- The latest Release and tag were v0.32.0, and v0.32.1–v0.34.0 had none. The owner asked for the v0.34.0 Release, and for every release to publish its own from now on.
- [v0.34.0](https://github.com/everett7623/Linketry/releases/tag/v0.34.0) is published and marked Latest, titled "v0.34.0 — Tailwind CSS 4 Admin and security hardening".
  - The tag is on `a3cc818`, the release commit, as with earlier tags.
  - The notes follow the v0.32.0 Release: they open with "Covers v0.32.1 – v0.34.0" and condense the CHANGELOG under Upgrade notes, Added, Changed, Fixed, Removed and Security.
  - The upgrade notes give the Admin browser baseline. They also state that no D1 migration or binding changed since v0.32.0: `git diff v0.32.0 a3cc818 -- migrations/` is empty, and the only configuration addition is the optional `LINKETRY_IP_HASH_SECRET`.
- No workflow listens to tags or releases: the push triggers in `deploy.yml` and `deploy-demo.yml` are limited to `main`, and no run followed the tag.
- `docs/DEVELOPMENT.md` now has the release checklist that TASKS Next was tracking, with the Release as step 6. `AGENTS.md` (Release Hygiene) and `CLAUDE.md` (发布规范) point to it.

## Dependency check

`npm outdated` (official registry) on `cc3e75d`:

| Package | Installed | In range | Latest | Result |
| --- | --- | --- | --- | --- |
| `hono` (Worker) | 4.13.13 | 4.13.14 | 4.13.14 | updated, floor `^4.13.14` |
| `react-router-dom` (Admin) | 7.18.4 | 7.18.5 | 7.18.5 | updated, floor `^7.18.5` |
| `wrangler` (Worker) | 4.151.1 | 4.156.0 | 4.156.0 | kept (H7, below) |
| `react`, `react-dom`, `@types/react`, `@types/react-dom` | 18.3 | — | 19.3 | new major |
| `vite` (Admin, site) | 6.4.5 | — | 8.3.5 | new major |
| `@vitejs/plugin-react` | 4.7.0 | — | 6.1.2 (requires Vite 8) | new major |
| `typescript` | 5.9.3 | — | 7.0.2 | new major |
| `lucide-react` | 0.418.0 | — | 1.66.0 | new major |
| `@cloudflare/workers-types` | 4.20260702.1 | — | 5.20261031.1 | new major |

### Hono 4.13.14

- The release fixes no advisory and nothing Linketry uses directly: serve-static, JSX, the CSS minifier, `basePath`, bearer-auth, duplicate trie-router parameters, and `getPath` with `strict: false`.
- The Worker creates every app with `new Hono<{ Bindings: Env }>()`, so it uses the default router with `strict` on.
- One fix reaches the redirect path: PR 5495 (`_getQueryParam`).
  - A single-key lookup now falls back to the full parse when an earlier key in the query is percent-encoded, so it returns the first key that matches after decoding.
  - The redirect path reads only `c.req.query('linketry_confirm')` this way. `buildRedirectUrl` and `interstitialQuery` use `URL.searchParams`.

Comparison harness (not committed):

- Both Hono copies ran the Worker's route layout: `*`, `/health`, `/api/*`, `/admin`, `/admin/*`, `GET` and `POST /:slug`, and `/`.
- 18 paths × 22 query shapes × GET/POST gave 792 requests. 756 were identical.
- The other 36 are exactly the queries that have `linketry%5Fconfirm` before a plain `linketry_confirm`. In those, the first of the two now decides.
- The warning page is a confirmation, not an access control: a plain `?linketry_confirm=1` already skips it, as documented for H5. So this lets a visitor do nothing they could not already do.

### React Router 7.18.5 and the lockfile

- React Router 7.18.5 changes only server rendering, RSC and turbo-stream decoding, none of which the Admin SPA uses. It also brings `set-cookie-parser` 2.7.3.
- `package-lock.json` changed only for `hono`, `react-router`, `react-router-dom` and `set-cookie-parser`, plus the two declared ranges. `grep -c npmmirror package-lock.json` is 0.

## Wrangler re-check (H7)

The check reuses the harness from the v0.34.0 investigation (not committed):

- `wrangler dev` ran on a copy of the seeded state, kept on a short ignored path (`.wrangler/px-state`).
- The Admin Vite dev server ran on 5174.
- 240 authenticated requests went through its proxy, 8 at a time.

| Wrangler | Proxy | OK / 240 | Notes |
| --- | --- | --- | --- |
| 4.156.0 | `localhost`, keep-alive (current config) | 154, 154 | 81–82 × 500 and 4–5 timeouts from 85 Vite proxy errors, in two runs |
| 4.156.0 | `127.0.0.1` target | 155 | same failure |
| 4.156.0 | `http.Agent({ keepAlive: false })` | 240, 239 | about 30 workerd lines "HTTP connection failed: 提供了一个无效的参数。 (os error 10022)" per run; one proxy error in the second run |
| 4.151.1 | each of the three | 240 | no errors |

Findings:

- The failures do not depend on IPv4/IPv6 resolution.
- Without keep-alive they become rare but do not go away, and workerd still logs the socket errors, so the workaround was not adopted.
- No issue in `cloudflare/workers-sdk` or `cloudflare/workerd` mentions the error.
- The temporary `vite.config.ts` change used for the test was reverted.

## Validation

I mirrored the three `Validate Linketry` jobs locally on the final v0.34.1 working tree. They ran one after another, and every step passed on its first run:

- Deployment contracts 92/92.
- Demo API 6/6.
- Site 10/10, and the site build.
- Worker type-check, and Worker tests 187/187.
- Admin unit 74/74.
- Admin browser smoke 45/45 (40.9 s).
- Production build plus `test:production` 3/3, and isolated Demo build plus `test:production` 3/3.
- Quick Deploy build.
- Worker dry run: 484.80 KiB / gzip 111.36 KiB. With v0.34.0 it was 484.53 KiB / 111.30 KiB.

I compared the dry-run `index.js` of v0.34.0 and v0.34.1 (Quick Deploy profile). Only three places differ:

- Hono's `_getQueryParam` (the query-order fix above).
- The trie router: it now keeps the first value of a duplicate path parameter, which `/:slug` cannot have.
- The version string.

`git diff --check` is clean, and the deployment contracts pass again (92/92) after the record edits.

## Commit

Committed on local `main` as `e3b2201` with the owner's approval (2026-10-31).

## Release

Deployed 2026-10-31 with the owner's approval, the first release through the new checklist:

- Pushed `e3b2201` to a temporary `release/v0.34.1` branch and dispatched [Validate Linketry 41177855838](https://github.com/everett7623/Linketry/actions/runs/41177855838). The contracts, Worker and Admin jobs passed, including the Admin browser suite.
- Pushed `main` (`cc3e75d..e3b2201`) and deleted the temporary branch. Both pushes went through the proxy.
- [production 41180555668](https://github.com/everett7623/Linketry/actions/runs/41180555668): success. It was an authenticated dispatch with `expected_release=0.34.1` and `expected_commit=e3b2201c43cde4d85bbcfe62cd3ecedae7ef2825`. No migration changed. The push-triggered production run `41180549543` skipped on `[skip production]`.
- [isolated Demo 41180549568](https://github.com/everett7623/Linketry/actions/runs/41180549568): success; triggered by the push.
- [project site 41180558132](https://github.com/everett7623/Linketry/actions/runs/41180558132): success; exact-commit confirmation.

Live checks (2026-10-31):

- `go.uukk.de/health` and `demoapi.linketry.com/health` report 0.34.1.
- `admin.uukk.de`, `linketry-admin.pages.dev` and `demo.linketry.com` serve favicon `?v=0.34.1`, a new `vendor-react` chunk (React Router 7.18.5) and the unchanged `index-qBmuQgde.css`.
- `linketry.com` `llms.txt` and JSON-LD report 0.34.1.
- The production login page renders v0.34.1 in a browser with no console errors.

Production without a token:

- `/api/v1/links`, `/api/v1/system/upgrade`, `/api/v1/qr-style`, `/api/v1/openapi.json`, `/api/v1/docs` and `/api/v1/auth/me` return 401.
- An unknown slug returns 404, and the `/health` CORS preflight returns 204.
- `/api/v1/auth/login` answers 400 "Token is required" to an empty body and 401 "Invalid token" to a wrong token.

Demo: `GET /api/v1/qr-style` returns 200 and `POST /api/v1/links` returns 403.

[GitHub Release v0.34.1](https://github.com/everett7623/Linketry/releases/tag/v0.34.1) is published on `e3b2201` and marked Latest. No workflow ran for the tag.
