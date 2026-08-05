# Online Upgrade Target Binding And State Isolation - 2026-08-06

## Goal

Close the three v0.30.6 review findings without weakening production gates: bind the confirmed release to an exact GitHub commit, prevent overlapping Admin upgrade operations, and preserve a single accessible modal on mobile.

## Scope

- Require the authenticated Admin to submit its confirmed target version.
- Resolve the configured GitHub branch to an exact commit and read package metadata from that commit before dispatch.
- Pass expected release and commit inputs to the protected workflow and reject drift before Cloudflare writes.
- Keep one active Admin upgrade operation and ignore stale callbacks through operation generations.
- Close mobile navigation before opening the version center and restore focus to the mobile menu trigger.
- Synchronize release metadata as v0.30.7 without changing redirects, analytics, D1/KV ownership, migrations, or stored data.

## Status

- [x] Implement Worker target resolution and fail-closed version comparison.
- [x] Extend workflow dispatch and manual approval validation with exact target inputs.
- [x] Update Admin request payload, synchronous operation lock, and generation checks.
- [x] Repair mobile modal ownership, Tab trapping, and focus restoration.
- [x] Update OpenAPI request/response contracts and focused tests.
- [x] Synchronize v0.30.7 release metadata and development records.
- [x] Complete full affected regression.
- [ ] Deploy and verify production through owner-controlled release gates.

## Verification

- Worker and Admin TypeScript checks pass.
- 92 deployment, 112 Worker, 6 Demo API, 64 Admin unit, 26 Admin browser, 1 production browser, and 10 site tests pass.
- Admin and site production builds pass.
- Admin browser coverage uses the installed system Chrome after Playwright Chromium download timed out.

## Safety Boundaries

- No redirect handler, redirect decision, analytics ingestion, D1/KV ownership, migration, secret value, or stored-data behavior changes.
- Target resolution and workflow expectation validation happen only in the authenticated online-upgrade control path.
- Branch drift fails before Worker-secret, migration, Worker deploy, Pages deploy, or DNS writes.
- Production remains on v0.30.6 until existing owner-controlled approval variables are updated and the protected workflow runs.
