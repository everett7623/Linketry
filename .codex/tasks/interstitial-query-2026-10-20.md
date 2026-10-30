# Interstitial query parameters — 2026-10-20 (v0.33.2)

Baseline: started on `91a172f` (v0.33.0, deployed on all tracks) in the worktree branch `claude/intelligent-hypatia-45c163`. Meanwhile the H6 session took v0.33.1 (`54eb8cc`, deployment record `d8f7007`) and added the Syncthing `.gitignore` entry (`b75183f`), so this release is v0.33.2, rebased onto `origin/main` `b75183f`. v0.33.1 changed no redirect or public-page file. Starting this session was the owner's explicit approval for this redirect-path change (golden rule 1), limited to KNOWN_ISSUES H5.

## Finding (KNOWN_ISSUES H5)

`renderWarningPage` linked Continue to `/<slug>?linketry_confirm=1` and `renderPasswordPage` posted to `/<slug>`, so the second request carried none of the visitor's parameters and `buildRedirectUrl` had nothing left to forward: UTM and other parameters on warning-enabled or password-protected links never reached the destination. Recorded during the v0.33.0 analysis.

## Change

- [x] `routes/redirect.ts`: `interstitialQuery(c)` copies the request's query parameters except `linketry_*` (case-insensitive, the rule `buildRedirectUrl` uses; `buildRedirectUrl` itself is unchanged), keeping their order and repeated keys. It runs only in the branches that render a page: the password page (also after a wrong password), the warning page (also its password form) and the warning page of the KV-hit fallback while D1 is unavailable.
- [x] `utils/publicPages.ts`: `appendQuery` appends the carried parameters, serialized by `URLSearchParams`, to the form `action` and the Continue `href`. `linketry_confirm=1` stays first, so a page with nothing to carry renders exactly as before. Attribute values still pass through `escapeHtml`: `URLSearchParams` already percent-encodes quotes and angle brackets, and `escapeHtml` turns the separators into `&amp;`. `utils/response.ts` passes the new optional argument through.
- [x] `linketry_*` is dropped rather than echoed because a shared URL that already carries `linketry_confirm=1` would otherwise pass it through the password form and skip the warning that follows unlocking. A warning-only link opened with `?linketry_confirm=1` still skips the warning, as before; the page is a confirmation, not an access control.
- [x] Equivalence: the second request parses the carried parameters back into the same pairs, so after confirming or unlocking the `Location` equals what a direct redirect with the original query gives, including `buildRedirectUrl`'s last-wins handling of repeated keys.
- [x] Not covered: the URL fragment never reaches the server and the page CSP (`default-src 'none'`) allows no script to read it, so a fragment survives a direct redirect (the browser reapplies it) but not the Continue click. Noted in KNOWN_ISSUES H5.

## Tests

`src/routes/redirect.test.mjs` (+5) follows each page the way a browser does: it reads the Continue `href` or form `action` from the returned HTML, decodes `&amp;` and requests that target.

- Warning → Continue → 302 with `utm_source` and `utm_medium`.
- Password page → wrong password (401, the form still carries the query) → correct password → 302.
- Password and warning → password → warning form → 302.
- D1 unavailable with a cached warning link → Continue → 302 to the cached destination with the query.
- `linketry_confirm=0` and `LINKETRY_preview=1` are not echoed, and a shared `?linketry_confirm=1` on a password and warning link still shows the warning after unlocking.

The existing correct-password test posts straight to the URL with the query, so it passed on the old code; the new tests take the target from the page instead.

`src/utils/publicPages.test.mjs` (+3): exact `href` and `action` values with a query (form-encoded, `&amp;` separators), unchanged targets without one (`/promo`, `/promo?linketry_confirm=1`), and hostile values (`"><script>…`, `'`, `&`) that stay percent-encoded inside the attribute.

## Mutation checks

Each variant was written over the sources, both test files were run, and the sources were restored and hash-checked afterwards (19/19 passing again). Run on the v0.33.0 base and again on `b75183f`, with the same results:

| Variant | Failing tests |
| --- | --- |
| Previous code (identical in v0.33.0 and v0.33.1) | 7: all new tests except the no-query rendering test, which pins the old targets |
| No `linketry_*` filter | 2: fallback, not-echoed |
| Case-sensitive filter | 1: not-echoed (`LINKETRY_preview`) |
| No `escapeHtml` on the targets | 3, including the existing escaping test |
| Fallback warning page without the query | 1 |
| Password page without the query | 3 |
| Warning page (normal path) without the query | 3 |
| Visitor parameters before `linketry_confirm` | 6 |

## Differential check

The base `apps/worker/src` (`git archive b75183f`; before the rebase `91a172f`) and the new code were loaded side by side and driven with the same D1/KV doubles:

- Links without a warning or password: 11 states (KV miss and hit, D1 down, 301, disabled, expired status, archived, past `expires_at`, click limit reached, not found, limited cache entry during D1 failure) × 8 query shapes (none, UTM, with `linketry_confirm`, repeated keys, encoded and invalid percent sequences, `LINKETRY_*`, only control parameters, empty keys) × GET and POST.
- Warning, password, password and warning, and fallback warning pages with nothing to carry (no query, or only `linketry_*`), each as GET and as a wrong and a correct password POST.

All 212 comparisons had identical status, headers, body and storage writes. With a visitor query, the 11 rendered pages differed only in the link or form target.

## Boundaries

`buildRedirectUrl`, the cache, the D1 lookups, the order of the access gates, smart rules, analytics and the responses for links without a warning or password are unchanged. No migration, Admin, API or binding change.

## Version coordination

The H6 session asked this one to take v0.33.2. The metadata rebase kept H6's fixed status in KNOWN_ISSUES and the v0.33.1 sections of CHANGELOG, PROGRESS and TASKS, and moved the `[Unreleased]` Syncthing `.gitignore` entry from `b75183f` into the v0.33.2 changelog, because it ships with this release.

## Validation

Independent re-run on 2026-10-31 by the main session, on `d963caa` checked out detached in the main checkout after a clean `npm ci` (official registry via the root `.npmrc`; lockfile unchanged). Local mirror of all three `ci.yml` jobs (Node 24.20.0, Playwright 1.64.1 with Chromium 156), run sequentially, all green:

- Deployment contracts 92/92; Demo API 6/6; project site 10/10 and production build.
- Worker type-check passed; Worker 187/187 (179 before this change, plus the 8 new tests).
- Admin unit 74/74; Admin browser suite 45/45 on the first full run (45.5 s).
- Production Admin build + `test:production` 3/3; isolated Demo Admin build + `test:production` 3/3.
- Quick Deploy `npm run build` and `npx wrangler deploy --dry-run`: 484.53 KiB / gzip 111.30 KiB.

## Merge and release

- With the owner's approval (2026-10-31), local `main` was fast-forwarded from `b75183f` to `d963caa`. This record had stayed untracked in the review worktree; it is committed with the validation result. The commit is local only.
- Not pushed or deployed: production, Demo, Admin and site remain on v0.33.1. The next release (v0.34.0, Tailwind CSS 4) is built on top of this commit.
