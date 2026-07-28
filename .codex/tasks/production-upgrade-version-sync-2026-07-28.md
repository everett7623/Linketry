# Production Upgrade Version Synchronization

Date: 2026-07-28
Release: 0.29.16

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
- Lock both command paths with regression tests.
- Synchronize v0.29.16 release metadata and deployment examples.

## Verification

- [x] Reproduced the incorrect sentinel D1 query.
- [x] Confirmed the explicit production config reads the real remote migration state.
- [x] Run 89 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 1 production-build browser, 6 Demo API, and 10 site tests.
- [x] Build production, Demo, Quick Deploy, and site artifacts and pass Wrangler dry-run.
- [ ] Deploy the reviewed production workflow.
- [ ] Verify `go.uukk.de/health` and `admin.uukk.de` both advertise v0.29.16.
