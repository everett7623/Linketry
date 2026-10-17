# Admin locale split and QR reload hint — 2026-10-17

## Scope and source

- Local `main` equals `origin/main` (`f265abe`, v0.31.7 deployed). Owner approved a four-batch upgrade plan; this record covers batch 1 only.
- Patch version: `0.31.8`. Admin-only change; redirect logic, Worker, D1/KV, migrations and Demo isolation untouched. Not committed, pushed or deployed.

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

## Remaining

- Owner review, then commit, push and protected deployment.
- Batches 2–4: `Links.tsx` split, visual audit report, branded QR design.
