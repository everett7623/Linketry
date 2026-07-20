# Beginner Deployment Automation - 2026-07-20

## Objective

Make a fresh Linketry fork deployable by a first-time self-hoster without mixing GitHub Actions and manual Wrangler paths, while preserving every production, Demo, data, and redirect safety boundary.

## Delivered

- Added `npm run deploy:configure` with dry-run/apply modes, exact confirmation, repository/auth checks, clean-commit release approvals, resource reuse, stdin-only account secret handling, and post-write verification.
- Updated the production workflow to create a missing Admin Pages project after the safety gate and upload Worker secrets alongside the first Worker deployment.
- Added a manual-only protected workflow to sync `LINKETRY_GITHUB_UPDATE_TOKEN` without deploying code or applying migrations.
- Reworked README, self-hosting, deployment, and fresh-account rehearsal around one recommended beginner path.
- Corrected Cloudflare permissions, optional KV/R2/Queue boundaries, first-login token instructions, Pages URL examples, and stale release examples.
- Added deployment and documentation regression coverage; redirect and analytics code were not changed.

## Verification

- `npm run test:deployment`: 72 passed.
- Prettier checks for the new workflows/scripts, Admin message, README, self-hosting, deployment, and fresh-account documents: passed.
- `npm run test:worker`: 84 passed; `npm run test:site`: 4 passed; Demo API: 6 passed; Admin unit: 58 passed; Admin browser: 25 passed.
- Admin and Site production builds plus Worker type-check: passed; npm official registry audit (full and production-only): 0 vulnerabilities.
- Full repository verification passed after rebasing onto the latest remote upgrade-feedback work; v0.27.8 is published with `[skip ci]`.

## Deliberately Deferred

- Independent clean-account/fork evidence is still required before claiming one-click or zero-knowledge deployment.
- Large-data benchmarks, manual assistive-technology review, release/support policy, and a branded isolated Demo redirect domain remain pre-1.0 work.
- Production Worker/Admin stay on v0.27.7 while repository v0.27.8 is used for the owner-controlled update discovery and upgrade rehearsal.
