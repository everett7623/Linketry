# Scheduled Health Monitoring - 2026-07-11

## Status

Implementation complete and verified locally for Linketry 0.8.4.

## Completed

- [x] Added opt-in daily Cron monitoring for active links.
- [x] Added a configurable 1-50 link limit with a default of 20.
- [x] Checked links in concurrency groups of five.
- [x] Added signed `health_check.failed` Webhook summaries for anomalies.
- [x] Made Cron independent of R2 and skipped scheduled backups when R2 is unavailable.
- [x] Added bilingual Settings controls and a localized Webhook event label.
- [x] Kept redirect handling, analytics isolation, schema shape, and KV behavior unchanged.

## Deferred

- [ ] Persisted target status history and failure counters (requires an explicitly approved migration).
- [ ] Retry windows, suppression, Admin notices, and recovery notifications.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests
