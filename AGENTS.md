# AGENTS.md — AI Agent Instructions for Linketry

This file tells AI coding agents (Cascade, Codex, Copilot, etc.) how to work on this codebase safely and correctly.

---

## Project Overview

Linketry is a **self-hosted link management, analytics and monitoring platform** built as a TypeScript monorepo:

- `apps/worker` — Cloudflare Workers backend (redirects + admin API)
- `apps/admin` — React + Vite + Tailwind CSS admin panel
- `packages/shared` — shared TypeScript types and validators

Public progress and planning live in `PROGRESS.md`, `TASKS.md`, and `docs/ROADMAP.md`. **Read them before making major changes.**

---

## Golden Rules

1. **Redirect stability is the #1 priority.** Never touch redirect logic without explicit instruction.
2. **Stats failures must not break redirects.** Analytics runs via `ctx.waitUntil()` — keep it that way.
3. **Only implement the requested version.** Do not write V2/V3/V4 features unless explicitly asked.
4. **KV is cache only.** D1 is the source of truth. Never make KV the primary data source.
5. **Never silently overwrite existing slugs** during import. Default conflict strategy is `skip`.
6. **Never commit secrets.** `LINKETRY_ADMIN_TOKEN` and other secrets go in `.dev.vars` or Wrangler secrets — never in code.

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

---

## Architecture

### Redirect Flow

```
User visits /:slug
→ Worker checks KV cache
→ KV hit: redirect immediately
→ KV miss: query D1 links table
→ Found active link: write KV, then redirect
→ async ctx.waitUntil(): record visit stats
→ Not found: return 404 HTML page
```

### Admin API Auth (V1)

```
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
```

All `/api/v1/*` routes require this header. The token is compared in `apps/worker/src/auth/index.ts`.

### KV Cache Keys

```
linketry:slug:<domain>:<slug>
```

### KV Cache Rules

| Event          | KV Action              |
|----------------|------------------------|
| Create link    | Write to KV            |
| Update link    | Delete old, write new  |
| Disable link   | Delete from KV         |
| Delete link    | Delete from KV         |
| Visit link     | Read; write on miss    |

---

## Code Conventions

### Backend (`apps/worker`)

- Use `src/db/index.ts` for all D1 queries — do not inline SQL in routes
- Use `src/cache/index.ts` for all KV operations
- Use `src/utils/response.ts` for standardized JSON responses
- Use `src/utils/id.ts` for ID generation and slug generation
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

## What NOT to Do

- Do NOT add multi-user, team, or role features — that is V4+
- Do NOT add complex analytics charts — that is V3+
- Do NOT add `expires_at`, `max_clicks`, `password_hash` UI fields — that is V2+
- Do NOT add AI slug or UTM templates — that is V4+
- Do NOT add Bulk Actions UI — that is V2+
- Do NOT add `domains` table or multi-domain UI — that is V2/V3+
- Do NOT change the `visits` table schema — it is stable for V1
- Do NOT remove the `archived`, `source`, `source_id` columns from `links` — they are used by the importer

---

## Import System

All importers implement the `ImportAdapter` interface from `packages/shared`.

V1 adapters (already implemented):
- `apps/worker/src/importers/shlink.ts` — Shlink JSON / JSONL / CSV
- `apps/worker/src/importers/generic.ts` — Generic CSV / JSON

When adding a new importer in V2:
1. Create `apps/worker/src/importers/<name>.ts`
2. Implement `ImportAdapter`
3. Register in `apps/worker/src/routes/importRoutes.ts`

---

## Database

Schema is in `migrations/0001_init.sql`. All tables for V1–V4 are defined there.

V1 active tables:
- `links` — main short link table
- `visits` — visit records
- `tags` — tag list
- `import_jobs` — import history
- `settings` — system settings

V2/V3/V4 tables exist in the schema but are not used in V1 code.

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
- [ ] Import confirm does not overwrite existing slugs
- [ ] Export downloads a valid file

---

## Running Locally

```bash
npm install
# Worker
npm run dev --workspace=apps/worker   # http://localhost:8787
# Admin
npm run dev --workspace=apps/admin    # http://localhost:5173
```
