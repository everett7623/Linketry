# Operations Dashboard - 2026-07-11

## Status

Implementation complete and verified locally for Linkora 0.8.6.

## Completed

- [x] Added an Advanced-mode Operations route and navigation item.
- [x] Added backup freshness and scheduled monitoring status.
- [x] Added Queue configuration and Worker deployment health.
- [x] Added explicit on-demand checks with current warning/broken target details.
- [x] Displayed fallback URLs alongside unhealthy targets.
- [x] Added bilingual UI and browser smoke coverage.
- [x] Kept page load read-only and preserved redirect, analytics, schema, and KV behavior.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests
