# Online Upgrade Auto Reload

Date: 2026-07-20
Version: 0.27.4
Status: Complete

## Goal

Ensure an old Admin page cannot remain indefinitely in the finalizing state after a successful production online upgrade.

## Evidence

- Production workflow run `29718967204` completed successfully for v0.27.3.
- GitHub recorded deployment `5517191479` under the `production` environment.
- Production `/health` reports v0.27.3 and a newly opened Admin page reports v0.27.3 as up to date.
- The old page waits exclusively for its in-memory runtime-version poll before scheduling a reload; that path has no independent bounded reload fallback.

## Work

- [x] Preserve exact runtime-version verification and the existing fast success reload.
- [x] Schedule a replaceable 10-second reload fallback when the workflow enters finalizing.
- [x] Add a real-browser regression where runtime polling remains stale after workflow success.
- [x] Synchronize v0.27.4 release metadata and documentation.
- [x] Run 48 Admin unit, 21 browser, 82 Worker, 64 deployment, 6 Demo API, and 4 site tests plus affected builds.
- [x] Publish v0.27.4 to `main` with `[skip ci]` while leaving production on v0.27.3 for the owner-controlled upgrade test.

## Safety Boundary

- Failed workflows never enter finalizing and never trigger the fallback.
- A fallback reload does not claim an unverified version; the fresh page performs normal version discovery again.
- Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data are unchanged.
- Publishing uses `[skip ci]`, so repository version discovery advances without bypassing the owner-controlled production upgrade boundary.
