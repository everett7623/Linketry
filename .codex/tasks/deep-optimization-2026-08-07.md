# Deep Optimization Roadmap — v0.31.0

Date: 2026-08-07

## Goal

Ship Phases 0–5 of the deep optimization plan: docs truth, security hardening, Demo/prod/site isolation, deploy UX, Admin IA, site narrative.

## Done in repo

- [x] AGENTS/CLAUDE/ARCHITECTURE/KNOWN_ISSUES/PRODUCT_GAP/AT checklist alignment
- [x] Admin API scopes for backups, import confirm, bulk destroy/URL replace confirm, metadata, health
- [x] Egress SSRF guard + webhook usage
- [x] Auth rate limits, constant-time admin compare, PBKDF2 link passwords
- [x] `LINKETRY_DEMO_ALLOW` fail-closed gate; CORS origins; site version inject
- [x] Quick Deploy postdeploy hint; Settings sections; Advanced nav groups; skip-to-content
- [x] API error localization helper for Settings
- [x] Release metadata synchronized to v0.31.0

## Operator follow-up

- [x] Approve and deploy v0.31.0 via protected production workflow (`31125426247`)
- [x] Deploy isolated Demo (`31124712930`); Worker health parity at 0.31.0
- [ ] Authenticated online-upgrade verification on production Admin
- [ ] Fresh-account rehearsal evidence in PROGRESS
- [ ] AT checklist pass (`docs/AT_AUDIT_CHECKLIST.md`)
- [x] Enable GitHub private vulnerability reporting (`enabled: true` via API, 2026-08-10)
- [ ] Optional Demo R2 (`10042`) when account capability allows
- [ ] Optional remote-D1 scale evidence
