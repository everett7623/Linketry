# Dev/build toolchain advisories — 2026-10-18 (v0.32.2)

Fetched `origin/main` was still `58ea539` (v0.32.0). v0.32.1 exists only as the local, unpushed `main` commit `00caf43`; with the user's approval this patch is built on `00caf43` and is not pushed. The worktree branch was fast-forwarded from `58ea539` to `00caf43` with no local changes. Production (`go.uukk.de/health`), Demo (`demoapi.linketry.com/health`), Admin (`admin.uukk.de` version meta and favicon `?v=`) and site (`linketry.com/llms.txt`) all reported v0.32.0 on 2026-10-18.

- [x] `npm audit --registry=https://registry.npmjs.org` baseline: 13 advisories (2 moderate, 11 high), all in development/build dependencies; `--omit=dev` reports 0.
- [x] Worker `wrangler` 4.115.0 → 4.151.1 (`npm install wrangler@^4.151.1 --workspace=apps/worker --registry=https://registry.npmjs.org`, declared floor `^4.151.1`). Wrangler pins Miniflare 5.20261012.1-beta (was 4.20260722.1), which pins sharp 0.35.5 (was 0.35.2) and undici 7.29.1 (was 7.28.0). Wrangler has pinned Miniflare 5 pre-releases since 4.117.0 (alpha, then beta from 4.150.0), so there is no fixed Wrangler 4 on Miniflare 4; 4.131.0 is the first release the advisories no longer cover.
- [x] Admin `postcss` 8.5.24 → 8.5.30 (`npm install postcss@^8.5.30 --workspace=apps/admin --registry=https://registry.npmjs.org`, declared floor `^8.5.30`). PostCSS 8.5.30 requires nanoid `^3.3.20` and source-map-js `^1.2.2`, so the floor keeps both fixes even if the lockfile is regenerated; installed nanoid 3.3.16 → 3.3.20 and source-map-js 1.2.1 → 1.2.2.
- [x] Lockfile review: only wrangler and its pinned tree changed (miniflare, workerd and its five platform packages, wrangler's private esbuild 0.28.1 → 0.28.2 and its platform packages, sharp and its `@img/*` packages with libvips 1.3.1 → 1.3.4, undici, `@cloudflare/unenv-preset` 2.16.1 → 2.16.2, `@speed-highlight/core` 1.2.17 → 1.2.24 under Miniflare's `youch`), plus postcss, nanoid and source-map-js, plus the workspace version entries. No package was added or removed, every `resolved` URL is `registry.npmjs.org` (the five workspace links aside), `grep -c npmmirror package-lock.json` is 0, and `npm install --package-lock-only` regenerated an identical lockfile.
- [x] Supply chain: `npm audit signatures` verified registry signatures for all 216 installed packages; wrangler, miniflare, workerd, sharp, undici, esbuild, `@cloudflare/unenv-preset`, postcss and nanoid also carry verified provenance attestations (source-map-js publishes a registry signature only).
- [x] Output parity, with the 0.32.1 sources before the version bump: `npx wrangler deploy --dry-run --outdir` produced a byte-identical `index.js` with Wrangler 4.115.0 and 4.151.1 (481.11 KiB / gzip 109.87 KiB; the source map differs only in `sourceRoot`, which is the `--outdir` path), and all 86 files of the Quick Deploy Admin build (`npm run build`) kept the same SHA-256.
- [x] Workflow compatibility: every Wrangler subcommand and flag used by `deploy.yml`, `deploy-demo.yml`, `deploy-site.yml`, `sync-online-upgrade-secret.yml` and `ci.yml` (`deploy --config/--secrets-file/--strict/--dry-run`, `d1 migrations apply`, `d1 execute`, `secret put/list`, `pages project list/create`, `pages deploy`, `r2 bucket list/create`, `r2 object put`, `queues list/create`) is still listed in Wrangler 4.151.1 `--help`.
- [x] `SUPPORT.md` Supported Toolchain: Wrangler minimum 4.115.0 → 4.151.1, and the matching regexes in `scripts/support-policy.test.mjs` (the contract ties the declared floor to the documented minimum; same pattern as the v0.29.20 Wrangler bump). The first local run failed this assertion before the sync, as intended.
- [x] `npm audit` after the change: 7 advisories (2 moderate, 5 high), all in the Tailwind CSS 3 chain; `--omit=dev` still 0.
- [x] Synchronize v0.32.2 release metadata (36 literal replacements, the v0.32.1 file set) and status documents.

## Why

- wrangler/miniflare: sharp <0.35.4 bundles affected libheif builds (GHSA-rgj7-g3m4-5g8c) and <0.35.5 an affected librsvg (GHSA-wq5f-xc86-pv6w); the installed undici 7.28.0 was covered by fifteen advisories fixed in 7.29.0/7.29.1 (retry-interceptor desynchronisation and response splitting, private/shared cache disclosure, CRLF and cookie-attribute injection, decompression and WebSocket denial of service, BalancedPool TLS validation bypass). Miniflare loads both for `wrangler dev` and local simulation. Wrangler itself runs in the deployment workflows with Cloudflare credentials, so the toolchain is worth keeping current even though none of it reaches the Worker bundle.
- nanoid <3.3.18 can loop forever with a zero-size custom generator (GHSA-2v37-7h3g-55p8); source-map-js 1.0.0–1.2.1 has an event-loop denial of service through indexed source-map section offsets (GHSA-68fv-2mgg-jv7q). Both are PostCSS dependencies used only while building CSS.
- The Wrangler upgrade also replaces the bundler used for production deployments, so the dry-run bundle comparison is the evidence that redirect and API code ship unchanged.

## Boundaries

No source, redirect, cache, analytics, migration, API, binding, secret or Admin behaviour change. Beyond release metadata, the edits are the two declared floors in `apps/worker/package.json` and `apps/admin/package.json`, the matching lockfile entries, the `SUPPORT.md` Wrangler minimum and its contract-test regexes. Production, Demo and site are not deployed by this task.

## Remaining (separate task): Tailwind CSS 4 migration

The seven open advisories (braces GHSA-vfj7-8cjw-p6xm high; chokidar, fast-glob, micromatch and tailwindcss high through braces; postcss-selector-parser GHSA-rj75-hqrm-r3gf and postcss-nested moderate) cannot be fixed under Tailwind 3:

- braces 3.0.3 is the latest release and is itself affected (≤3.0.3); micromatch 4.0.8 and fast-glob 3.3.3 are also the latest releases and depend on it. tailwindcss 3.4.19 is the last 3.x release.
- The postcss-selector-parser fix (7.1.6) is a major version outside Tailwind 3.4.19's `^6.1.2` and postcss-nested 6.2.0's range. npm `overrides` could only force untested majors under Tailwind 3 and still would not clear the braces chain.
- Exposure: these packages only scan the repository's own `content` globs and parse its own CSS during `vite build` / `vite dev`. Nothing from them is in `apps/admin/dist` or the Worker bundle. The project site does not use Tailwind.

The user approved committing v0.32.2 without the migration (2026-10-19), so it stays a separate task. Impact assessment (Admin only):

- Toolchain: `tailwind.config.cjs` and `postcss.config.cjs` (`tailwindcss` + `autoprefixer`) move to `@tailwindcss/postcss` or `@tailwindcss/vite` (peer `vite ^5.2 || ^6 || ^7 || ^8`); `@tailwind base/components/utilities` becomes `@import "tailwindcss"`; the JS theme becomes `@theme` (or an `@config` bridge); autoprefixer is no longer needed.
- Theme variables: `src/index.css` defines `--color-slate-*` / `--color-brand-*` as RGB triplets consumed through `rgb(var(--…) / <alpha-value>)`, and the light theme inverts the slate scale through them. Tailwind 4 uses the same `--color-*` names for its own theme variables and builds opacity modifiers with `color-mix()`, so the triplets must be renamed (or turned into full colours) and the inversion re-expressed, or the colours resolve to invalid values.
- Token scan of the 185 TS/TSX files under `apps/admin/src` for classes whose v4 behaviour or name changes: width-only `border*` 259× in 73 files and `divide-x/y` 26× (default colour becomes `currentColor`); `rounded` 46× → `rounded-sm`, `rounded-sm` 5× → `rounded-xs`, `shadow-sm` 4× → `shadow-xs`, blur 5×; `outline-none` 30× in 18 files (→ `outline-hidden` to keep forced-colours focus outlines); `ring-*` / `ring-offset-*` 35× (default width and colour); `space-x/y-*` 89× in 48 files (new sibling selector); colour opacity modifiers 97× in 36 files; `hover:` 162× in 55 files (v4 applies it only on hover-capable devices); placeholder styling 11×; one `!` prefix.
- Preflight and palette: buttons fall back to `cursor: default`, placeholders take the text colour at 50%, and the default palette moves to OKLCH, so the unthemed status colours (red, amber, emerald, blue, sky, purple, yellow, orange) shift slightly. The unlayered `[data-theme='light'] .text-*` overrides still outrank v4's layered utilities; `.scrollbar-thin` moves to `@utility`.
- Browser baseline: Tailwind 4 targets Safari 16.4+, Chrome 111+ and Firefox 128+. That fits `SUPPORT.md` (current stable Chrome, Edge, Firefox and Safari) but narrows what older browsers render.
- Tests that read computed styles or contrast: `tests/accessibility.ts` (axe), `at-audit.spec.ts`, `page-accessibility.spec.ts`, `responsive-layout.spec.ts`, `i18n-smoke.spec.ts`, `analytics-refresh.spec.ts`.

Proposed plan for that task: capture dark/light, desktop/mobile screenshots of every Admin route from the current build; run `npx @tailwindcss/upgrade` on a clean branch; rename the theme triplets and rebuild `@theme` and the `[data-theme]` inversion; review the codemod output and add explicit border/ring/divide colours where defaults change; decide whether to keep v4 `hover:` semantics; pixel-compare the screenshots and fix regressions; rerun the full Admin unit and browser suites (axe contrast included) and all three CI jobs. The browser-baseline change probably warrants a minor release.

## Validation

Local mirror of all three `ci.yml` jobs (Node 24.20.0, npm 11.19.0, Windows), run sequentially after a clean `npm ci --registry=https://registry.npmjs.org` of the final lockfile. Playwright used ports 5183/4183 (`PLAYWRIGHT_PORT`, `PLAYWRIGHT_PRODUCTION_PORT`) so a dev server in another checkout could not collide; the tests do not depend on the port.

- First pass: everything passed except deployment contracts 91/92 — `support-policy.test.mjs` rejected the raised Wrangler floor until `SUPPORT.md` and the test were synchronized.
- Final pass, all green:
  - Deployment contracts 92/92; Demo API 6/6; project site 10/10 and production build.
  - Worker type-check passed; Worker 151/151.
  - Admin unit 73/73.
  - Admin browser suite (`test:smoke`, 41 tests): 41/41 on the first full run in 43.3 s, no timeouts (the first pass also ran 41/41).
  - Production Admin build (includes `tsc`) + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3.
  - Quick Deploy `npm run build` and `npx wrangler deploy --dry-run` on Wrangler 4.151.1: 481.11 KiB / gzip 109.87 KiB, `LINKETRY_VERSION` 0.32.2.
- `npm audit --registry=https://registry.npmjs.org`: 7 (2 moderate, 5 high, Tailwind 3 chain only); `--omit=dev`: 0.
- `npm install --package-lock-only --registry=https://registry.npmjs.org` regenerated an identical lockfile; `grep -c npmmirror package-lock.json` is 0.
- `git diff --check`: clean.
- Tailwind is unchanged in this patch, so no visual comparison was needed; the Admin build output was byte-identical before the version bump.

## Deployment evidence

Not deployed. Production, Demo and site remain on v0.32.0. v0.32.1 (`00caf43`) and this patch are local only: v0.32.2 was committed on `claude/funny-cray-3062ea` with approval on 2026-10-19 and not pushed. A push to `main` triggers the isolated Demo workflow even with `[skip production]`, so the push waits for approval together with the release.
