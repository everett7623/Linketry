# Linketry Demo Production Parity - 2026-07-17

## Goal

Keep the isolated public Demo on the same Admin version, brand assets, routes, and read-only feature surface as production while preserving synthetic data and write isolation.

## Tasks

- [x] Audit the live Demo version, favicon assets, production route inventory, and synthetic data coverage.
- [x] Add a deterministic Admin build version marker and canonical dark/light brand parity checks.
- [x] Add post-deployment verification for Demo version, brand assets, core read APIs, and write rejection.
- [x] Add synthetic advanced-feature records for production-like read-only pages.
- [x] Synchronize version, changelog, progress, tasks, and deployment documentation.
- [x] Run unit, deployment, Worker, build, production-mode, and Demo-mode browser regression.
- [x] Deploy v0.25.7 to production and the isolated Demo with the public parity gate passing.
- [x] Normalize canonical SVG line endings for consistent Windows and Linux verification in v0.25.8.

## Safety Boundary

- Redirect routing, KV cache behavior, production domains, and production data are outside this task.
- Demo data remains synthetic and all visitor-triggered mutations remain blocked before routing.
- Demo notification and webhook samples stay disabled and cannot deliver to external services.
- The workflow remains manual; this change verifies parity after deployment but does not silently enable automatic Cloudflare writes.
