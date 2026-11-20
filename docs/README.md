# Linketry Documentation Map

Day-to-day index for contributors and agents. Version authority: root `package.json` and `PROGRESS.md`. Safety rules: root [`AGENTS.md`](../AGENTS.md).

**Last updated**: 2026-11-20  
**Current version**: v0.35.4

Local-only notes (not on GitHub): `.codex/`, `docs/archive/`, Admin `PRODUCT.md` / `DESIGN.md` / `.impeccable/`.

---

## Start here

| Document | Use when |
| -------- | -------- |
| [`AGENTS.md`](../AGENTS.md) | Golden rules, hard limits, code placement |
| [`CLAUDE.md`](../CLAUDE.md) | Chinese quick reference for the same rules |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local workflow, verification, release checklist |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Redirect path, data ownership, failure boundaries |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Chinese PR / issue templates |

## API and contracts

- [API.md](API.md) — authenticated Admin API behavior
- Live OpenAPI: `/api/v1/openapi.json` on a running Worker
- [IMPORT_ADAPTERS.md](IMPORT_ADAPTERS.md) — importer contract (includes Shlink operator mapping)

## Self-hosting (fresh)

- [SELF_HOSTING.md](SELF_HOSTING.md) — first-time Cloudflare setup
- [QUICK_START.md](QUICK_START.md) — Cloudflare Quick Deploy path
- [DEPLOYMENT_PREFLIGHT.md](DEPLOYMENT_PREFLIGHT.md) — track gates before writes
- [FRESH_ACCOUNT_REHEARSAL.md](FRESH_ACCOUNT_REHEARSAL.md) — owner rehearsal checklist

## Upgrades and migration

- [UPGRADING_PRE_0_10.md](UPGRADING_PRE_0_10.md) — non-destructive upgrade from older installs
- [BACKUP_AND_RESTORE.md](BACKUP_AND_RESTORE.md) — export, R2 recovery, reset
- [CUTOVER.md](CUTOVER.md) — legacy short-domain cutover (+ migration timeline)

## Deployment tracks

- [DEPLOYMENT.md](DEPLOYMENT.md) — track checklist and CI secrets
- Root [`DEPLOYMENT.md`](../DEPLOYMENT.md) — short index into these guides

## Analytics and privacy

- [ANALYTICS.md](ANALYTICS.md)

## Internationalization

- [TRANSLATIONS.md](TRANSLATIONS.md)

## Ops and policy

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [SECURITY.md](SECURITY.md) — implementation hardening (reporting: root [`SECURITY.md`](../SECURITY.md))
- [`SUPPORT.md`](../SUPPORT.md) — compatibility, backups, rollback, help requests
- [GEO.md](GEO.md) — public site search / AI discovery policy
- [AT_AUDIT_CHECKLIST.md](AT_AUDIT_CHECKLIST.md) — assistive-technology evidence
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md)

## Planning

- [ROADMAP.md](ROADMAP.md)
- [PRODUCT_GAP_AUDIT.md](PRODUCT_GAP_AUDIT.md) — pre-1.0 priorities, non-goals, compatibility priorities
- Status trackers: [`PROGRESS.md`](../PROGRESS.md), [`TASKS.md`](../TASKS.md)

When two documents disagree, verify code and tests, then fix the narrow authoritative doc first ([DEVELOPMENT.md](DEVELOPMENT.md) ownership table).
