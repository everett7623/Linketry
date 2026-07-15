# Beginner Deployment Bootstrap - 2026-07-16

## Status

In progress. The read-only deployment-track preflight slice is complete; guided D1/KV provisioning and deployment rehearsals remain.

## Completed In This Slice

- [x] Added one `deploy:preflight` command for fresh self-hosting, existing upgrades, and the isolated official Demo.
- [x] Kept the command read-only by default and made Cloudflare inspection an explicit `--check-cloudflare` option.
- [x] Validated Worker, Pages, D1, KV, API URL, optional R2 pairing, and optional Queue configuration.
- [x] Masked account, D1, and KV identifiers and excluded Cloudflare/Admin token values from reports.
- [x] Required verified backup, migration review, target confirmation, and a concrete backup reference for upgrade preflight.
- [x] Rejected initialization, factory reset, Demo seeding, resource recreation, and domain replacement flags for upgrades.
- [x] Made Demo checks fail closed without protected production ID/name/domain lists and reject every overlap.
- [x] Separated manual Wrangler and GitHub Actions `LINKETRY_ADMIN_TOKEN` instructions.
- [x] Added policy tests and a CI test step.
- [x] Confirmed the current production upgrade target with 25 passing configuration/account/resource checks and zero writes.

## Remaining

- [ ] Build an idempotent, confirmation-gated D1/KV provisioning workflow for a new user's own Cloudflare account.
- [ ] Generate reusable binding output without writing maintainer identifiers into the repository.
- [ ] Enforce upgrade preflight gates in the production deployment workflow after verifying a current production backup.
- [ ] Build a separate Demo workflow with isolated synthetic resources and no production write capability.
- [ ] Rehearse the basic path on a fresh Cloudflare account and record first-link smoke results.
- [ ] Rehearse an existing-instance upgrade and record existing-link/data preservation results.

## Safety Notes

- Redirect code was not changed.
- D1 remains the source of truth; KV remains cache only.
- No Cloudflare resource was created, migrated, deployed, reset, seeded, or rebound by the preflight implementation.

## Verification

- `npm run test:deployment`: 9 passed.
- Current production `--track upgrade --check-cloudflare`: 25 passed, 0 failed, 1 informational warning for local Wrangler OAuth authentication.
- Production D1 point-in-time restore bookmark: available before release.
- Worker type-check and tests: 58 passed.
- Admin unit tests: 13 passed.
- Admin Chromium smoke tests: 7 passed.
- Admin production build: passed.
