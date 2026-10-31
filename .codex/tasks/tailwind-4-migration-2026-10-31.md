# Tailwind CSS 4 migration — 2026-10-31 (v0.34.0)

Baseline: `origin/main` `b75183f` (v0.33.1, deployed on all tracks). With the owner's approval, local `main` was first fast-forwarded to the H5 review commit `d963caa` (v0.33.2) after an independent full CI mirror, and its validation record was committed as `5901116`; neither is pushed. This migration builds on that commit. The impact assessment in `.codex/tasks/toolchain-advisories-2026-10-18.md` and the plan reviewed by the Tailwind session were reused; the owner chose Tailwind CSS 4's `hover:` semantics.

## Changes

- [x] Admin moves from Tailwind CSS 3.4.19 (PostCSS plus autoprefixer) to Tailwind CSS 4.3.3 through `@tailwindcss/vite`. `tailwind.config.cjs` and `postcss.config.cjs` are gone, and so are the Admin's direct `postcss` and `autoprefixer` dependencies (Vite still brings postcss 8.5.31).
- [x] The official `@tailwindcss/upgrade` 4.3.3 codemod rewrote 44 files, all renames with the same output: `rounded` → `rounded-sm` (46), `rounded-sm` → `rounded-xs` (5), `outline-none` → `outline-hidden` (31), `shadow-sm` → `shadow-xs` (4), backdrop-blur renames (5), `break-words` → `wrap-break-word` (2), `[overflow-wrap:anywhere]` → `wrap-anywhere`, and two arbitrary values onto the v4 scale. No utility removed in v4 is left, and no test selects a renamed class.
- [x] Theme (`src/index.css`): the codemod emitted self-referencing `--color-slate-50: rgb(var(--color-slate-50))` next to the base-layer RGB triplets, which would have resolved to invalid colours. Rewritten: slate and brand are full colours in `@theme static` with dark as the default, and `[data-theme='light']` overrides the same variables in `@layer base`, so opacity modifiers (`color-mix` in v4) follow the theme. `.scrollbar-thin` is an `@utility`; the unlayered light-theme text overrides keep winning over layered utilities.
- [x] Appearance pins, each found by the codemod review or the screenshot comparison below:
  - the Tailwind CSS v3 values for the 14 colour families in use (154 variables; v4's default palette is OKLCH);
  - the v3 sans stack: 4.3 starts with `-apple-system`/`"Segoe UI"`, while v3 used `system-ui`, which on Chinese Windows renders Latin text in the wider system UI font; every page reflowed until this was pinned;
  - the v3 rem line heights for `text-xs` … `text-4xl`: v4 uses unitless ratios, so children that set only a size (`text-[10px]` badges) inherited a 13 px line instead of 16 px, and the sidebar footer lost 3 px on every page;
  - the v3 preflight defaults for border colour (added by the codemod), placeholder colour (gray-400) and button cursor (pointer).
- [x] Two layout fixes for v4's `space-y` semantics (the gap is now `margin-block-end` on non-last children): the webhook events label is inline and cannot carry that margin, so the gap moves to the grid below it (`mt-2`); the Modal overlay gets `m-0`, so a dialog rendered inside a `space-y` stack covers the whole viewport. Under v3 the Links QR dialog's overlay started 24 px down; under v4 any dialog that is not the last child would have lost 24 px at the bottom.
- [x] `hover:` keeps v4's default (only on hover-capable devices), by the owner's decision.
- [x] `SUPPORT.md` records the Admin browser baseline that Tailwind CSS 4 needs: Chrome and Edge 111, Firefox 128, Safari 16.4. That is the reason for a minor version.
- [x] Dependency audit: the seven Tailwind 3 advisories are gone. Two advisories published after 2026-10-21 also surfaced and are fixed: vite 6.4.4 `server.fs.deny` bypass (GHSA-8g5g-mxqh-grgj, dev server only) → vite 6.4.5 with `^6.4.5` floors in the Admin and site; undici 7.29.1 EventSource memory DoS (GHSA-4qv8-2p9j-2685) under Wrangler 4.151.1's Miniflare → npm override `miniflare > undici 7.30.1` (next section). `npm audit` against the official registry: 0, and 0 with `--omit=dev`.

## Wrangler stays on 4.151.1, with an undici override

- Wrangler 4.153.0 and later ship undici 7.30.1, but every Wrangler from 4.152.0 (Miniflare 5.20261019) on breaks the Admin's local development on Windows: requests that the Admin Vite dev server proxies to `wrangler dev` are reset (Vite `ECONNRESET`; workerd logs "HTTP connection failed … os error 10022"). With 240 authenticated requests through the Vite proxy: 4.151.1 240/240; 4.152.0 144 ok, 90 × 500, 6 timeouts; 4.156.0 272/400 ok with 128 proxy errors. Direct requests to `wrangler dev` succeed on every version, and both versions listen on `127.0.0.1:8787`.
- undici is not the cause: 4.152.0 still has undici 7.29.1, and 4.151.1 with the 7.30.1 override passes 240/240 through the proxy. Wrangler 4.153.0 made the same undici update upstream.
- The Worker dry-run bundle (`index.js`, 484.53 KiB / gzip 111.30 KiB) is byte-identical before and after these dependency changes.
- Separate local finding while testing: with `--persist-to` paths of 259 characters or more, local D1 fails with "internal error" on every version (Windows path limit); Miniflare 5.2026101x+ adds an observability store with longer paths. A normal checkout stays around 186 characters.
- Remove the override when moving to a Wrangler release without the proxy regression (re-run the proxy check first).

## Visual comparison (harness not committed)

- Isolated local Worker (state on a short ignored path, throwaway token) seeded with 20 links, 198 visit requests (155 recorded clicks), tags, groups, redirect rules and an API token; the Admin Vite dev server; a fixed browser clock. 18 routes plus the login page × dark/light × 1440×900 and 390×844, full page with `#main-content` unrolled, plus the QR dialog, the mobile drawer and the expanded mobile filters: 82 screenshots. The v0.33.2 (Tailwind 3) baseline was re-run once and matched itself pixel for pixel.
- After the migration: 60 of 82 identical. The other 22 are explained: date inputs 2 px shorter (12 screenshots; v4's preflight removes Chrome's datetime field padding, so date inputs now match the text inputs beside them, where v3 made them 2 px taller), a 1 px content shift in `divide-x` cells (8; the divider is drawn at the end of the previous cell), and the centred QR dialog (2; the v3 overlay offset above).
- Admin CSS grows from 43.85 kB (gzip 8.21 kB) to 56.79 kB (gzip 10.13 kB), mostly v4's `@property` declarations and `color-mix` output.

## Validation

- Local mirror of all three `Validate Linketry` jobs on the final working tree (v0.34.0 on `5901116`, Tailwind CSS 4.3.3, Wrangler 4.151.1), every step passing on its first run: deployment contracts 92/92, Demo API 6/6, site 10/10 and build, Worker type-check and 187/187, Admin unit 74/74, Admin browser smoke 45/45, production and Demo builds with their smoke tests 3/3 each, Quick Deploy build, and Worker dry run 484.53 KiB / gzip 111.30 KiB. A run before the version bump gave the same results, except that the Quick Deploy build once hit a transient `EBUSY` on a `dist` source map and passed on re-run.
- Worker dry-run `index.js` at v0.34.0: identical to v0.33.2's apart from the version string.
- `npm audit` against the official registry: 0, and 0 with `--omit=dev`; `package-lock.json` has no mirror URLs. `git diff --check` reports only the trailing spaces that the edited doc header lines already had.
- Vite proxy check on Wrangler 4.151.1 with the undici override: 240/240 authenticated requests.

## Release

Deployed 2026-10-31 as `a3cc818`, together with the v0.33.2 H5 fix (`d963caa`) and its record (`5901116`), with the owner's approval.

- Pushed `a3cc818` to a temporary `release/v0.34.0` branch and dispatched [Validate Linketry 41167348996](https://github.com/everett7623/Linketry/actions/runs/41167348996): the contracts, Worker and Admin jobs passed, the Admin browser suite included. Then pushed `main` (`b75183f..a3cc818`) and deleted the temporary branch. The direct route to GitHub was blocked at the time; the pushes went through the proxy.
- [production 41167592333](https://github.com/everett7623/Linketry/actions/runs/41167592333): success; authenticated dispatch with `expected_release=0.34.0` and `expected_commit=a3cc818d0b3abfc900b83439afe097aeb7c7dc6d`. No migration changes since v0.33.1. The push-triggered production run `41167582211` skipped on `[skip production]`.
- [isolated Demo 41167582220](https://github.com/everett7623/Linketry/actions/runs/41167582220): success; triggered by the push.
- [project site 41167595220](https://github.com/everett7623/Linketry/actions/runs/41167595220): success; exact-commit confirmation.
- Live (2026-10-31): `go.uukk.de/health` and `demoapi.linketry.com/health` report 0.34.0; `admin.uukk.de`, `linketry-admin.pages.dev` and `demo.linketry.com` serve favicon `?v=0.34.0` and `assets/index-qBmuQgde.css` with the `tailwindcss v4.3.3` banner, the same content hash as the locally built and tested Admin; `linketry.com` `llms.txt` and JSON-LD report 0.34.0. The production login page renders correctly in a browser, with no console errors.
- Production without a token: `/api/v1/links`, `/api/v1/system/upgrade`, `/api/v1/qr-style`, `/api/v1/openapi.json`, `/api/v1/docs` and `/api/v1/auth/me` return 401, an unknown slug returns 404, and the `/health` CORS preflight returns 204; `/api/v1/auth/login` without a bearer header answers 400 "Invalid request body" and 401 "Invalid token". Demo `GET /api/v1/qr-style` returns 200 and `POST /api/v1/links` returns 403.
