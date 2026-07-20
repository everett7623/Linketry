# Case: Successful Online Upgrade Leaves the Old Admin Page Finalizing

Date: 2026-07-20

## Symptom

The GitHub workflow and production deployment succeed, but the already-open Admin page continues to display “verifying runtime version” until the operator refreshes manually.

## Evidence

- Workflow run `29718967204` completed successfully.
- GitHub deployment `5517191479` recorded the same commit under `production`.
- Production `/health` and a newly opened Admin page both reported v0.27.3.
- Only the old page retained the finalizing state, proving the deployment and new assets were healthy.

## Root Cause

The old SPA scheduled a reload only after its own `/health` polling observed the exact target version. Browser network transitions, timer throttling, or temporary polling interruption could therefore leave the in-memory finalizing state visible for the full polling window. There was no independent bounded reload after the workflow had already succeeded.

## Fix

- Keep exact runtime-version polling and its 800 ms success reload.
- When the successful workflow enters finalizing, schedule one replaceable 10-second fallback reload.
- If exact verification succeeds first, replace the fallback with the fast reload.
- Never schedule the fallback for a failed workflow.

## Verification

- Mock a successful workflow while `/health` remains on the previous version.
- Confirm finalizing appears, the page reloads within the bound, and the fresh page is no longer busy.
