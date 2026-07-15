# Simplified Deployment Access - 2026-07-13

## Status

Complete and verified locally for Linketry 0.9.14.

## Completed

- [x] Made `admin.example.com` and `go.example.com` the recommended Admin and API entry points.
- [x] Added bilingual access and token guidance to Login and Setup.
- [x] Made the deployment workflow generate ADMIN_TOKEN only when the Worker has none.
- [x] Preserved the existing Worker token on later deploys.
- [x] Added a repository-secret recovery override for lost tokens.
- [x] Added a GitHub Actions deployment summary and `LINKETRY_ADMIN_URL`.
- [x] Updated deployment and self-hosting documentation.

## Safety

- Redirect behavior, D1 source-of-truth rules, KV behavior, import conflict defaults, and analytics scheduling are unchanged.

## Verification

- [x] GitHub Actions YAML parsed successfully
- [x] Worker tests (26 passing) and type-check
- [x] Admin unit tests (8 passing)
- [x] Admin Playwright smoke (3 passing)
- [x] Admin production build
- [x] `git diff --check`
