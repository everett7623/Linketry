# AGENTS.md — AI Agent Instructions for Linketry

This file tells AI coding agents (Cascade, Codex, Copilot, etc.) how to work on this codebase safely and correctly.

**Last updated**: 2026-08-19
**Current version**: v0.31.2
**Production version**: v0.31.1

Version authority: root `package.json` and `PROGRESS.md`. Prefer those over older stamps in historical docs.

---

## Project Overview

Linketry is a **self-hosted link management, analytics and monitoring platform** built as a TypeScript monorepo:

- `apps/worker` — Cloudflare Workers backend (redirects + admin API)
- `apps/admin` — React + Vite + Tailwind CSS admin panel
- `apps/site` — official marketing / deploy site (`linketry.com`)
- `apps/demo-api` — branded Demo API Pages proxy
- `packages/shared` — shared TypeScript types and validators

Public progress and planning live in `PROGRESS.md`, `TASKS.md`, and `docs/ROADMAP.md`. **Read them before making major changes.**

---

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Backend  | Cloudflare Workers + TypeScript + Hono  |
| Database | Cloudflare D1 (SQLite)                  |
| Cache    | Cloudflare KV                           |
| Frontend | React + Vite + Tailwind CSS             |
| Monorepo | npm workspaces                          |

## Requirements

| Tool       | Version                      |
|------------|------------------------------|
| Node.js    | 24.x (`>=24 <25` in engines) |
| npm        | 10+                          |
| TypeScript | 5.4+                         |
| Wrangler   | 4                            |
| Cloudflare | Account with D1, KV, Worker, Pages |

---

## Golden Rules

1. **Redirect stability is the #1 priority.** Never touch redirect logic without explicit instruction.
2. **Stats failures must not break redirects.** Analytics runs via `ctx.waitUntil()` — keep it that way.
3. **Only implement the requested scope.** Do not invent V10 multi-user/teams or unrelated roadmap items unless explicitly asked.
4. **KV is cache only.** D1 is the source of truth. Never make KV the primary data source.
5. **Never silently overwrite existing slugs** during import. Default conflict strategy is `skip`.
6. **Never commit secrets.** `LINKETRY_ADMIN_TOKEN` and other secrets go in `.dev.vars` or Wrangler secrets — never in code.
7. **Keep site / production / Demo tracks isolated.** Never reuse Demo credentials, accounts, or `LINKETRY_DEMO_MODE=read-only` on a real instance.

---

## Capability Matrix (shipped)

Treat these as **already implemented**. Do not refuse to maintain them because older “V1 only” notes said otherwise.

| Area | Status |
|------|--------|
| Redirects, KV+D1, CRUD, import/export | Shipped |
| Expiry, max clicks, password links, QR | Shipped |
| Bulk ops, UTM templates, multi-domain | Shipped |
| Smart redirect rules, groups | Shipped |
| Analytics depth, heatmap, world map, conversions | Shipped |
| Backups/R2, health checks, webhooks, notifications | Shipped |
| API tokens (read/write/admin), audit, online upgrade | Shipped |
| Simple/Advanced Admin, i18n en/zh-CN, first-run wizard | Shipped |
| Official Demo (read-only), Quick Deploy, OpenAPI | Shipped |

**Not started / future:** V10 multi-user/roles/teams; additional locales beyond en/zh-CN unless requested; Cloudflare Access (optional Pre-1.0).

---

## Hard Limits (What NOT to Do)

- Do **not** break redirect stability or move analytics onto the redirect critical path.
- Do **not** make KV authoritative or skip D1 re-verification on cache hits.
- Do **not** change the default import conflict strategy away from `skip`.
- Do **not** remove `archived`, `source`, `source_id` from `links` (importers depend on them).
- Do **not** change the `visits` table schema without an explicit migration task.
- Do **not** add multi-user / team / RBAC product features unless the task is V10-scoped.
- Do **not** enable `LINKETRY_DEMO_MODE` outside the isolated Demo track.
- Do **not** commit secrets, live tokens, or production resource IDs.
- Do **not** add new D1 migrations without explicit instruction.

---

## Release Hygiene

Every intentional project change must keep release metadata synchronized in the same change set:

- Bump the Linketry version using semantic versioning.
- Update root and workspace package versions, `package-lock.json`, and `packages/shared/src/version.ts`.
- Update version examples in `.env.example`, `apps/worker/wrangler.toml.example`, deployment docs, and CI fallback values when they contain a literal version.
- Update `CHANGELOG.md` with the user-visible change, fix, or maintenance note.
- Update `PROGRESS.md`, `TASKS.md`, and relevant `.codex/tasks/*.md` records when project status or active work changes.

Do not leave code, workflow, config, or documentation changes without matching version and changelog updates.

---

## Current State

See `PROGRESS.md` for what is built and what is pending.
See `TASKS.md` for the active task list.
See `docs/KNOWN_ISSUES.md` for open hardening / limitations.
See `docs/ROADMAP.md` for product sequencing.

---

## Architecture

### Redirect Flow

```
User visits /:slug
→ Worker checks KV cache for linketry:slug:<domain>:<slug>
→ KV hit: re-verify link status in D1 (handles disable/delete/expiry during cache propagation)
→ KV miss: query D1 links table by domain and slug
→ Found active link: write to KV with smart TTL, then redirect
→ Found disabled/expired: return appropriate HTML page
→ Not found: return 404 HTML page
→ async ctx.waitUntil(): record visit stats (never blocks redirect)
```

**Key principle**: D1 is the source of truth. KV is a disposable acceleration layer. Even on cache hits, D1 status is re-checked to ensure disable, delete, expiry, and click-limit changes take effect immediately.

### Admin API Auth

```
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
```

All `/api/v1/*` routes require this header (except the official Demo read-only exception). Scoped API tokens use `read` / `write` / `admin`. Destructive ops (backups restore, import confirm, bulk destroy, SSRF-capable fetches) require `admin`.

### KV Cache Keys

```
linketry:slug:<domain>:<slug>
```

### KV Cache Rules

| Event          | KV Action              | TTL Strategy |
|----------------|------------------------|--------------|
| Create link    | Write to KV            | Smart TTL (1h-7d based on usage) |
| Update link    | Delete old, write new  | Smart TTL |
| Disable link   | Delete from KV         | - |
| Delete link    | Delete from KV         | - |
| Visit link     | Read; write on miss    | Smart TTL |

**Smart TTL**: Hot links (>1000 clicks) = 7 days, warm links (>100 clicks) = 3 days, default = 24 hours, cold links (<10 clicks) = 1 hour. Automatically adjusted for expires_at and max_clicks.

### Deployment tracks

| Track | Purpose |
|-------|---------|
| Production / self-host | Owner instance; never Demo mode |
| Official Demo | Isolated account; `LINKETRY_DEMO_MODE=read-only`; synthetic data |
| Project site | Static marketing/docs only |
| Quick Deploy | Same-origin Worker + `/admin/`; Demo forced off |

---

## Code Conventions

### Backend (`apps/worker`)

- Use `src/db/index.ts` for all D1 queries — do not inline SQL in routes
- Use `src/cache/index.ts` for all KV operations
- Use `src/utils/response.ts` for standardized JSON responses
- Use `src/utils/id.ts` for ID generation and slug generation
- Use `src/utils/egress.ts` for Worker-initiated outbound URL fetches
- Routes live in `src/routes/` — one file per resource
- Each route handler authenticates via `src/auth/index.ts`

### Frontend (`apps/admin`)

- API calls go through `src/api/` — one file per resource, never fetch directly from pages
- UI components live in `src/components/ui/` — reuse them, don't inline new ones
- Page components live in `src/pages/`
- Auth state is managed by `src/contexts/AuthContext.tsx`
- Toast notifications use `useToast()` from `src/components/ui/Toast.tsx`
- Routing is defined in `src/App.tsx`

### Shared (`packages/shared`)

- Types in `src/types/index.ts`
- Validators in `src/validators/index.ts`
- Import in other packages as `@linketry/shared`

---

## Import System

All importers implement the `ImportAdapter` interface from `packages/shared`.

Implemented adapters (non-exhaustive):
- `shlink.ts` — Shlink JSON / JSONL / CSV / API
- `generic.ts` — Generic CSV / JSON
- `mainstream.ts` / `platforms.ts` — Bitly, Short.io, Sink, YOURLS, Dub, and related

When adding a new importer:
1. Create `apps/worker/src/importers/<name>.ts`
2. Implement `ImportAdapter`
3. Register in `apps/worker/src/routes/importRoutes.ts`

---

## Database

Base schema: `migrations/0001_init.sql`. Incremental:

- `0002_analytics_depth.sql`
- `0003_performance_indexes.sql`

Active tables include links, visits, tags, domains, import_jobs, settings, api_tokens, audit_logs, backups, redirect_rules, visit_targets, conversion_events, and related analytics tables.

**Do not add new migrations without explicit instruction.**

---

## Testing Checklist Before Any PR

- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] Short link redirect works (200 → 30x)
- [ ] Disabled link returns disabled HTML page, not a redirect
- [ ] Non-existent slug returns 404 HTML page
- [ ] Admin API rejects requests without valid `Authorization: Bearer` token
- [ ] Creating a link writes to KV
- [ ] Disabling/deleting a link removes from KV
- [ ] Import preview shows correct counts (valid / conflict / invalid)
- [ ] Import confirm does not overwrite existing slugs by default
- [ ] Export downloads a valid file
- [ ] Demo (if touched): mutating APIs still 403; production paths never set Demo mode

---

## Running Locally

```bash
npm install
# Worker
npm run dev --workspace=apps/worker   # http://localhost:8787
# Admin
npm run dev --workspace=apps/admin    # http://localhost:5173
```
