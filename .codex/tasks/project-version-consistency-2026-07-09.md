# Project Version Consistency - 2026-07-09

## Goal

Make the project version visible and consistent across packages, runtime responses, Admin UI, deployment config, and docs.

## Completed

- [x] Bumped Linkora workspace package versions to `0.7.0`.
- [x] Updated `package-lock.json` workspace versions.
- [x] Added shared `LINKORA_VERSION` constant.
- [x] Worker `/health`, root response, backup payloads, and webhook payloads now use the shared version fallback.
- [x] Admin Login and Settings About use the shared version constant.
- [x] Updated `.env.example`, `wrangler.toml.example`, deployment docs, self-hosting docs, backup docs, and changelog.
- [x] Updated GitHub Actions `LINKORA_VERSION` repository variable to `0.7.0`.
- [x] Updated GitHub Actions Node runtime to Node 24.
- [x] Made Worker `LINKORA_VERSION` env type optional to match docs and fallback behavior.

## Verification

- [x] `npm run type-check --workspace=apps/worker`
- [x] `npm run build --workspace=apps/admin`
- [x] `git diff --check`
