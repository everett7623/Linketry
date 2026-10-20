# Security hardening and dependency updates — 2026-10-20 (v0.33.0)

Baseline: this clone's `main` was at `58ea539` (v0.32.0) while `origin/main` was at `dba6eef` (v0.32.3); there were no local commits or uncommitted changes, so `main` was fast-forwarded. Production, Demo, Admin and site were at v0.32.3. `git fetch` needed the environment proxy (`127.0.0.1:7897`) passed with `-c`, because the github.com proxy in the user's `~/.gitconfig` points at `127.0.0.1:10808`, which was not listening. The July stash and four v0.29-era local branches that `.codex/tasks/links-layout-repo-cleanup-2026-10-19.md` removed in the other clone still exist in this one and were left untouched.

The owner chose the scope: the deterministic fixes, redirect-path hardening (explicit approval for golden rule 1, limited to the items below), keyed IP hashing, a project `.npmrc`, in-range dependency updates, then commit, push and deploy.

## Findings and changes

- [x] **Sign-in lockout on limiter failure** (`routes/auth.ts`). One `try/catch` wrapped both the rate limiter and the JSON parse, so a KV error, for example an exhausted Workers Free write quota, answered 400 "Invalid request body" until the quota reset. The route now handles the two separately.
- [x] **Limiter failure policy** (`auth/rateLimit.ts`). `checkAuthRateLimit` catches storage errors, logs `Auth rate limiter failed` and returns `rateLimiterFailureResult(bucket)` with `source: 'unavailable'`. Owner decision: `login` fails open (the admin bearer token is accepted by every unthrottled `/api/v1/*` route, so this limit is not its protection) and `link-password` fails closed (the limit is the main protection for user-chosen link passwords, and each allowed attempt writes KV, so an attacker can exhaust the quota on purpose). Callers answer 503 for `unavailable` and 429 for an ordinary limit hit.
- [x] **Redirect KV-hit fallback** (`routes/redirect.ts`, approved). The `try` wrapped the whole re-check, including `accessGate`, so any later error fell back to the cached redirect. With a cache entry written before a password was added (KV deletes take up to about 60 s to propagate) and a failing limiter, a password POST could redirect without the password; on a KV miss the same error was an unhandled 500. Only the D1 lookup now falls back (`cachedFallbackResponse`), and the fallback forwards query parameters through `buildRedirectUrl` (H4). Smart rules and visit recording are still skipped there.
- [x] **Reversible IP hashes** (`utils/ipHash.ts`). Visits, conversion events and audit logs stored `sha256(ip)`, and the visits CSV export includes it; IPv4 has 2^32 values, so it can be brute-forced. With the optional Worker secret `LINKETRY_IP_HASH_SECRET`, `hashClientIp` uses HMAC-SHA256 (same 64-hex shape, no schema change); without it, SHA-256 as before. Backups do not contain visits. `wrangler deploy --secrets-file` preserves secrets that are not in the file (Cloudflare docs, Workers secrets), so the deploy workflow needs no change.
- [x] **Shlink API pull without timeout** (`routes/importRoutes.ts`). Each page now uses `AbortSignal.timeout(SHLINK_API_PAGE_TIMEOUT_MS)` (10 s, covering redirects and the body) and reports a readable timeout error; the Admin call uses `API_LONG_TIMEOUT_MS` (60 s) instead of the 15 s default for this multi-page pull.
- [x] **Double-quoted SQL string literals** (`db/index.ts`, four queries including `getDomainlessLinkBySlug` on the redirect lookup) → single quotes. Not a live bug: an isolated `wrangler d1 execute --local --persist-to <scratch>` run showed workerd's SQLite accepts `!= ""` (DQS enabled).
- [x] **Accessibility regression surfaced by axe-core 4.14** (`label-content-name-mismatch`, WCAG 2.5.3 Label in Name) on every Admin page: the expanded sidebar version button showed "v0.33.0 Up to date" but was named "Check for updates", and the interface-mode switch's adjacent spans read "Interface modeAdvanced". The version button now takes its name from its visible text (with an explicit space) and keeps the action in `title` as its description; collapsed to an icon it keeps the `aria-label`. The mode switch gains an explicit space (not rendered between flex items). Five browser assertions that pinned the old name now check the new name and the description.
- [x] **Flaky first render** (`tests/links-layout.spec.ts`). The first `toHaveCount` used the default 5 s while the other first-paint checks use 15 s; it failed in two of three full parallel runs on a cold dev server and passed 16/16 when repeated alone.
- [x] **Mirror URLs in the lockfile** (v0.32.0 regression, fixed in v0.32.1). The user's global npm registry is `registry.npmmirror.com`; a root `.npmrc` with `registry=https://registry.npmjs.org/` now overrides it for this project.
- [x] New known issue H5: the warning page's Continue link and the password form drop the visitor's original query string.

Checked without findings: public page escaping and CSP, CSV formula neutralization, egress SSRF validation, SQL interpolation (whitelisted sorts and update fields, bounded timezone offsets), pagination bounds, notification webhook host allowlists, the Admin never using `long_url` as an `href`, `rel="noopener"` on all 15 `target="_blank"` links, backup restore validation, and the admin-token requirement on online upgrades.

## Dependencies

`npm install` from the official registry raised the declared floors to the installed versions: Admin `dayjs` ^1.11.23, `react-router-dom` ^7.18.4, `@axe-core/playwright` ^4.14.0, `@playwright/test` ^1.64.1, `autoprefixer` ^10.6.1, `postcss` ^8.5.31, `vite` ^6.4.4; site `vite` ^6.4.4. The lockfile changed 17 entries (the seven packages plus `axe-core`, `playwright`, `playwright-core`, `react-router`, `browserslist`, `caniuse-lite`, `electron-to-chromium`, `node-releases`, `update-browserslist-db` and `baseline-browser-mapping`); nothing was added or removed. All 323 `resolved` URLs are `registry.npmjs.org`, `npm audit signatures` verified the tree, and `npm install --package-lock-only` regenerated an identical lockfile. `npm audit`: 7 (the Tailwind CSS 3 chain, H3), `--omit=dev`: 0. Majors left for separate decisions: Tailwind 4, React 19, Vite 8, `@vitejs/plugin-react` 6, `lucide-react` 1, TypeScript 7, `@cloudflare/workers-types` 5.

## Mutation checks

The previous code was swapped back temporarily (restored and hash-checked afterwards):

- Original `redirect.ts` and `auth.ts` with a limiter that throws: the login test reproduced "Invalid request body", the password test reproduced the redirect to the stale cached URL, and the H4 test failed. A fourth failure came from the stricter token check (a numeric token was 401 before, 400 now).
- New `redirect.ts` with a limiter that throws: the password test failed only on the status (`500` instead of `503`) with no `Location`, so the narrowed `try` alone prevents the bypass.
- Fallback without `buildRedirectUrl`: only the H4 test failed.

## Environment notes

- The local Node.js is v25.2.1 (end of life; `engines` requires `>=24 <25`, CI uses 24.15.0). npm only warns (`engine-strict` is off), and every suite passed on it, but the user should install Node 24.
- Playwright 1.62 needed Chromium 1234 (only 1228 and 1243 were installed; running against 1243 crashed workers), and 1.64.1 installs Chromium 1248 (Chrome 156).

## Validation

Local mirror of all three `ci.yml` jobs (Node 25.2.1, npm 11.15.0, Windows) after a clean `npm ci`, with the CI build variables; Playwright on ports 5183/4183:

- Deployment contracts 92/92; Demo API 6/6; site 10/10 and build.
- Worker type-check; Worker 175/175 (151 + 24).
- Admin unit 74/74; Admin browser 45/45 (Playwright 1.64.1, Chromium 156) after the accessibility fix.
- Production Admin build + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3.
- Quick Deploy build and `npx wrangler deploy --dry-run`: 483.75 KiB / gzip 111.08 KiB, `LINKETRY_VERSION` 0.33.0.
- `git diff --check`: only the existing trailing spaces on the four touched "Last updated" lines (Markdown hard line breaks in ARCHITECTURE, CONTRIBUTING and DEVELOPMENT, one stray space in CLAUDE.md), kept so the headers render as before.

## Deployment evidence

Pending.
