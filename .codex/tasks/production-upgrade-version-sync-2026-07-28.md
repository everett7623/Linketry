# Production Upgrade Version Synchronization

Date: 2026-07-28
Release: 0.29.18

## Objective

Restore the reviewed GitHub upgrade path for the maintained production instance at `admin.uukk.de` and keep its Worker and Admin versions synchronized.

## Environment Boundaries

- `admin.uukk.de` and `go.uukk.de`: owner-operated production Admin and Worker.
- `linketry.com`: official project site and production-only Cloudflare Quick Deploy entry point.
- `demo.linketry.com`: the single official GitHub Demo, deployed through the isolated Demo workflow.

## Diagnosis

- Production Worker and Admin both remained on v0.29.13 after v0.29.15 reached GitHub `main`.
- Push deployment first failed its stale release approval, as designed.
- The approved manual deployment passed release, commit, migration digest, backup, target, and resource checks.
- Its final read-only migration check used `--cwd apps/worker`, but Wrangler selected the repository root Quick Deploy template and queried its sentinel D1 ID.
- Explicit `--config apps/worker/wrangler.toml` queried the configured production D1 successfully and reported no pending migrations.

## Changes

- Select the generated production Worker config explicitly in the production migration gate.
- Select the generated Demo Worker config explicitly in the official Demo migration gate.
- Select the generated production Worker config explicitly during D1 migration application and Worker publication.
- Allow the strict Admin asset/version readiness check to cover up to ten minutes of Pages propagation.
- Lock both command paths with regression tests.
- Synchronize v0.29.16 release metadata and deployment examples.

## Verification

- [x] Reproduced the incorrect sentinel D1 query.
- [x] Confirmed the explicit production config reads the real remote migration state.
- [x] Run 90 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 1 production-build browser, 6 Demo API, and 10 site tests.
- [x] Build production, Demo, Quick Deploy, and site artifacts and pass Wrangler dry-run.
- [x] Confirm official Demo workflow `30371208433` deploys v0.29.16 successfully.
- [x] Confirm production workflow `30371241109` passes the repaired safety gate and isolate the follow-up config-selection failure.
- [x] Deploy v0.29.17 Worker and Admin through the reviewed production workflow.
- [x] Verify `go.uukk.de/health`, `admin.uukk.de`, and the official Demo advertise v0.29.17.
- [x] Deploy v0.29.18 through production run `30375704922` and verify the workflow completes successfully.
- [x] Verify production Worker/Admin and official Demo all advertise v0.29.18.
