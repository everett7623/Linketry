# Short-Link Domain Migration - 2026-07-14

## Status

Complete and verified locally for Linketry 0.9.19.

## Completed

- [x] Preserve the existing destination/Aff URL replacement feature.
- [x] Add source-domain to target-domain preview for every matching stored link.
- [x] Update D1 `domain`, generated `short_url`, and `updated_at` in one statement.
- [x] Keep each slug and `long_url` unchanged.
- [x] Reject stale confirmations when the matching count changed after preview.
- [x] Clear old and new domain KV cache entries in bounded batches.
- [x] Record the migration in audit logs and download a migration record CSV.
- [x] Add Advanced Admin EN/ZH migration UI and target-domain guidance.
- [x] Leave redirect logic unchanged.

## Verification

- [x] Worker type-check and tests (34 passing).
- [x] Admin build, unit tests (8 passing), and browser smoke tests (4 passing).
- [x] Local D1 migration SQL verification preserves `long_url` and unrelated domains.
- [x] Deployment workflow YAML and diff checks.
