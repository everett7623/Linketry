# Cloudflare Auto-Provisioning Correction

Date: 2026-07-25
Target release: 0.29.15
Status: In progress

## Goal

Correct the public production Quick Deploy profile so current Wrangler and Cloudflare Deploy Button can provision fresh D1/KV resources without invalid empty-string identifiers.

## Reconstructed Breakpoint

- Remote and local `main` both point to `0a2956f` / v0.29.14.
- The interrupted patch did not apply; only the root/workspace v0.29.15 package versions remained in the worktree.
- The public v0.29.14 source contains the intended production-only secret boundary but still uses empty D1/KV ID fields.
- The public `linketry.com` build still lacks `/llms.txt` and the new crawler policy.

## Safety Boundaries

- Other-user Quick Deploy uses Cloudflare's automatic provisioning from the public source repository.
- Quick Deploy builds a same-origin normal Admin and must override any ambient Demo build variables.
- The official Demo remains an upstream-only `main` synchronization target for production-version parity testing.
- Official `linketry.com` publication uses an upstream-only GitHub Actions job, never local Wrangler authentication.
- The site-only workflow must be manual, exact-commit bound, and unable to deploy Worker/Admin/Demo, run migrations, change DNS, or touch D1/KV data.

## Status

- [x] Reconstruct remote, local, and interrupted worktree state.
- [x] Reproduce the invalid Wrangler configuration and verify the official replaceable-default contract.
- [x] Replace empty IDs with valid non-account template defaults; add a regression contract.
- [x] Force production Admin builds out of Demo mode and guard Demo synchronization to the official repository.
- [x] Add a protected, manual, site-only GitHub Actions workflow and contract test.
- [x] Remove the legacy project-site write from the production workflow while retaining site tests and build validation.
- [x] Add a separate read-only pull-request CI matrix that cannot access deployment credentials or mutate Cloudflare.
- [x] Synchronize v0.29.15 metadata and documentation.
- [x] Pass configuration parsing/dry-run, full regression, production/Demo builds, and injected-variable isolation checks.
- [x] Push release commit `72cc716`, open Draft PR #13, and pass all three read-only PR CI jobs.
- [ ] Publish with existing production/Demo push workflows skipped.
- [ ] Rehearse Quick Deploy in a fresh Cloudflare account and verify provisioned D1/KV IDs replace the reserved template defaults.
- [ ] Dispatch and verify only the public project-site workflow.
