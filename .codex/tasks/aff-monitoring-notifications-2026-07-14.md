# Aff Target Monitoring Notifications - 2026-07-14

## Status

Complete and verified locally for Linkora 0.9.18.

## Completed

- [x] Reuse scheduled health checks of active links' original `long_url` targets.
- [x] Run health checks hourly while keeping backups, reports, and cleanup on the daily Cron.
- [x] Preserve alert thresholds, suppression, persisted history, and recovery decisions.
- [x] Add Telegram, Discord, Slack, Feishu, DingTalk, and WeCom native payload adapters.
- [x] Retain the existing signed generic Webhook.
- [x] Add per-provider save and test APIs.
- [x] Add an Advanced Settings notification panel with EN/ZH copy.
- [x] Keep credentials write-only and remove them from settings and backup responses.
- [x] Restrict Webhook credentials to official HTTPS endpoints.
- [x] Leave redirect logic unchanged.

## Verification

- [x] Worker type-check and tests (32 passing).
- [x] Admin build, unit tests (8 passing), and browser smoke tests (4 passing).
- [x] Deployment workflow YAML and diff checks.
