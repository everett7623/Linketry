# Next Development Plan - 2026-07-15

## Status

Bulk UTM Priority 1 completed in v0.9.24. The later sequence continues in `public-launch-and-sink-roadmap-2026-07-15.md`, starting with OpenAPI.

## Priority 1 — Bulk UTM Append And Normalization

- [x] Reuse Advanced Links selection and filter scope.
- [x] Offer add-missing, replace-selected, and remove-selected UTM modes.
- [x] Preserve unrelated query parameters, fragments, URL encoding, and destination validity.
- [x] Require a preview with before/after URLs and an exact affected count.
- [x] Keep D1 as the source of truth and write in a bounded 100-link batch.
- [x] Clear KV only for successfully updated links; do not change redirect logic.
- [x] Produce a downloadable change record and document rollback through backup/CSV data.
- [x] Cover URL policy, stale-row skipping, cache invalidation, and Admin confirmation flows.

## Later — Admin Display Preferences (Ordered Priority 7)

- [ ] Store sidebar and table density preferences in the browser for the current Admin.
- [ ] Add compact and comfortable layouts without reducing touch-target accessibility.
- [ ] Add instance-level visibility settings for optional Advanced modules.
- [ ] Keep Overview, Links, Create Link, Import/Export, Setup, Settings, and recovery access reachable.
- [ ] Preserve Simple/Advanced mode and English/Simplified Chinese behavior.
- [ ] Add persistence, navigation, and hidden-module regression coverage.

## Deferred

- [ ] Do not rotate the Shlink API key while Shlink is still required.
- [ ] Do not cut over the legacy short domain until remaining Shlink dependencies are confirmed clear.

## Required Verification

- [x] Worker type-check and focused policy tests.
- [x] Admin production build, unit tests, and browser smoke tests.
- [x] Maximum-batch regression for UTM writes and selective KV clearing.
- [x] Release metadata, changelog, task records, and diff checks.
