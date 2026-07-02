---
name: testing-linkora-admin
description: Test the Linkora admin frontend end-to-end. Use when verifying admin UI changes, page rendering, or API integration.
---

# Testing Linkora Admin Frontend

## Prerequisites
- Node.js installed
- Dependencies installed: `npm install` from repo root

## Environment Setup

### Cloudflare Worker (Backend)
The backend uses Cloudflare Workers with D1 (SQLite) and KV. For local dev:

```bash
# Copy .dev.vars.example to .dev.vars in apps/worker/
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Set ADMIN_TOKEN to any value for local testing
```

Run migrations and start the worker:
```bash
npm run db:migrate:local
npm run dev:worker  # starts on :8787
```

**Important:** Cloudflare's `workerd` runtime might crash on Windows Server 2022 (access violation / write EOF errors). If this happens, use the mock API server approach below.

### Mock API Server (Fallback)
If `workerd` doesn't work, create a Node.js mock API server (`mock-api.mjs`) that implements:
- `POST /api/auth/login` - token validation
- `GET /api/auth/me` - auth check
- `GET /api/overview` - dashboard stats
- `GET/POST /api/links` - list/create links
- `PUT /api/links/:id` - update link
- `DELETE /api/links/:id` - delete link
- `POST /api/links/:id/(disable|enable|archive|restore)` - status actions
- `GET/POST /api/tags`, `DELETE /api/tags/:id` - tag CRUD
- `GET/PUT /api/settings` - settings
- `POST /api/import/preview`, `POST /api/import/confirm` - import
- `GET /api/export/links.(csv|json)`, `GET /api/export/backup.json` - export

All endpoints require `Authorization: Bearer <ADMIN_TOKEN>` header. Responses follow `{ success: true, data: ... }` format.

### Admin Frontend
```bash
npm run dev:admin  # starts Vite on :5173, proxies /api to :8787
```

## Test Flows

### 1. Login
- Navigate to http://localhost:5173 (redirects to /login)
- Invalid token shows red error
- Valid token redirects to Overview

### 2. Overview Dashboard
- Stats cards: Total Links, Total Clicks, Today Clicks
- Recent Links and Top Links tables

### 3. Links CRUD
- Create: /links/create form with URL, slug, title, tags, redirect type, status
- List: /links with search, status filter, sort, pagination
- Edit: pencil icon opens dialog with pre-filled values
- Actions: disable/enable toggle, archive/restore, delete with confirm

### 4. Tags
- /tags page: list, create (name + color + description), delete

### 5. Settings
- /settings page: site_name, default_redirect_type, default_domain
- Save shows green success message

### 6. Import/Export
- /import-export page: file upload or paste, source type selection, preview, confirm
- Export buttons for CSV, JSON, backup

## Auth Token
Stored in `localStorage` as `linkora_token`. The API client reads it and sends as `Bearer` header.

## Devin Secrets Needed
None required for local testing. The ADMIN_TOKEN is set in `apps/worker/.dev.vars` (local-only file).

## Tech Stack
- Frontend: React 18, React Router 6, Tailwind CSS (dark theme), lucide-react icons, dayjs
- Backend: Cloudflare Workers, Hono framework, D1 database, KV cache
- Shared: `@linkora/shared` package with TypeScript types and validators
