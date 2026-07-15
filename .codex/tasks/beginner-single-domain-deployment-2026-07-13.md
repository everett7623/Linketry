# Beginner Single-Domain Deployment - 2026-07-13

## Status

Complete and verified locally for Linketry 0.9.15.

## Completed

- [x] Default Admin access to the automatic `linketry-admin.pages.dev` URL.
- [x] Require only `go.example.com` as the beginner custom domain.
- [x] Keep `admin.example.com` as an optional later enhancement.
- [x] Keep automatic stable ADMIN_TOKEN generation and retrieval guidance.
- [x] Update deployment summaries and documentation.

## Safety

- Redirect behavior and Worker API routing are unchanged.

## Verification

- [x] Worker tests (26 passing) and type-check
- [x] Admin unit tests (8 passing)
- [x] Admin Playwright smoke (3 passing)
- [x] Admin production build
- [x] GitHub Actions YAML parse and `git diff --check`
