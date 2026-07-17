# Linketry In-App One-Click Upgrade - 2026-07-17

## Goal

Provide a Sub2API-style in-app upgrade experience for the Cloudflare Workers and Pages deployment model without exposing deployment credentials to the browser.

## Research

- [x] Verify Sub2API checks GitHub Releases, validates SHA-256 checksums, atomically replaces its release binary, and keeps a local backup.
- [x] Verify Sub2API restarts by exiting and relying on systemd `Restart=always`.
- [x] Confirm Linketry has no local process or writable release binary, so its equivalent restart is a protected edge redeployment followed by an Admin reload.

## Tasks

- [x] Add fixed-repository GitHub Actions dispatch and run-status APIs to the Worker.
- [x] Keep the GitHub token in a Worker secret and restrict dispatch to the primary instance Admin token.
- [x] Add in-app confirmation, deployment progress, failure handling, and automatic reload to the Admin update banner.
- [x] Preserve the manual GitHub Actions fallback when automatic upgrades are not configured.
- [x] Synchronize OpenAPI, deployment workflow, self-hosting documentation, release metadata, changelog, progress, and task status.
- [x] Run focused and full regression checks before release.

## Safety Boundary

- The browser cannot choose a repository, workflow, branch, commit, or deployment target.
- The Worker can trigger only the configured repository's `deploy.yml` on the configured branch.
- The optional fine-grained GitHub token requires only repository `Actions: write` and is never returned by an API.
- Existing migration, backup, target, destructive-operation, and remote-resource gates remain mandatory.
- Redirect behavior, D1 records, KV cache behavior, and production short-link data are outside this change.
