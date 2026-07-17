# Linketry Online Upgrade - 2026-07-17

## Goal

Provide a safe online upgrade entry point without exposing GitHub or Cloudflare credentials in the Admin browser.

## Tasks

- [x] Diagnose the stale production Admin build and recover the approved v0.25.3 deployment.
- [x] Add an explicit GitHub Actions confirmation for authenticated manual release approval.
- [x] Link the Admin update banner to the deployment workflow and changelog.
- [x] Keep push deployments bound to repository approval variables.
- [x] Add deployment and Admin tests for the upgrade flow.
- [x] Synchronize v0.25.4 release metadata and documentation.
- [x] Run local regression, build, browser, and production readiness verification.
- [x] Prepare the completed release for commit and push.

## Safety Boundary

- Browser code never receives GitHub or Cloudflare credentials.
- Manual approval applies only to the exact selected workflow commit and package version.
- Migration digest, backup, migration review, target confirmation, and remote-resource checks remain mandatory.
- Redirect behavior and production link data are outside this change.
