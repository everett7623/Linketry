# Backup Retention - 2026-07-11

## Status

Complete and verified locally for Linkora 0.8.3.

## Completed

- [x] Added `backup_retention_days` with a 30-day default and 1-3650 day validation.
- [x] Added scheduled cleanup for expired R2 objects and matching D1 records.
- [x] Preserved D1 records when the R2 binding is unavailable.
- [x] Added bilingual Settings controls and Backups-page policy visibility.
- [x] Added Worker policy and deletion-order tests.
- [x] Kept redirect behavior, analytics scheduling, schema shape, and KV behavior unchanged.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests
