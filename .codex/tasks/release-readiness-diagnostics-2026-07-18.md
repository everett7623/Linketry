# Release Readiness Diagnostics - 2026-07-18

## Status

Implemented and regression verified for Linketry v0.26.4; production/Demo rollout is pending.

## Scope

- Preserve one update result across the toolbar, notification banner, and Settings page.
- Record the successful check timestamp and expose failures without blocking the Admin shell.
- Show installed and latest GitHub versions in Settings.
- Show whether protected one-click upgrade is ready, unavailable, invalid, or requires manual deployment.
- Refresh GitHub metadata and Worker upgrade capability together on an explicit check.

## Safety Boundary

- Capability diagnostics never return or render credential values.
- The optional `LINKETRY_GITHUB_UPDATE_TOKEN` stays in Worker or repository secret storage.
- Existing release approval, backup, migration, target, and destructive-operation gates remain mandatory.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Cloudflare resources are unchanged.

## Verification

- Deployment policy and Demo parity tests: 53 passed.
- Worker tests: 81 passed; TypeScript type-check passed.
- Admin tests: 48 unit and 20 Chromium browser tests passed; production build passed.
- Project-site tests: 4 passed; production build passed.
- Live rollout: pending.
