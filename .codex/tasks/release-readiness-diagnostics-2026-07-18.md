# Release Readiness Diagnostics - 2026-07-18

## Status

Implemented, regression verified, and deployed in Linketry v0.26.4.

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
- Isolated Demo run `29636513938` passed the production-parity gate and deployed v0.26.4.
- Production run `29636582863` deployed v0.26.4 from commit `7e56405`.
- Production and Demo Workers report v0.26.4; both Admins return 200 and expose the v0.26.4 favicon cache key.
- Live Demo Settings reports installed/latest v0.26.4, a successful check timestamp, and manual deployment mode.
- Production unauthenticated API and missing-slug checks return 401 and 404; the Demo read API remains publicly available in read-only mode.
