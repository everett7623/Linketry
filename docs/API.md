# Linkora API

All `/api/*` endpoints require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

Responses use:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": "message" }
```

## Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/:slug` | Short-link redirect |
| `POST` | `/:slug` | Password-protected short-link continuation |

Redirect analytics are recorded asynchronously. Stats failures must not block redirects.

## Auth

| Method | Path |
|--------|------|
| `POST` | `/api/auth/login` |
| `GET` | `/api/auth/me` |
| `POST` | `/api/auth/logout` |

## Links

| Method | Path |
|--------|------|
| `GET` | `/api/links` |
| `POST` | `/api/links` |
| `GET` | `/api/links/:id` |
| `PUT` | `/api/links/:id` |
| `DELETE` | `/api/links/:id` |
| `POST` | `/api/links/:id/disable` |
| `POST` | `/api/links/:id/enable` |
| `POST` | `/api/links/:id/archive` |
| `POST` | `/api/links/:id/restore` |
| `POST` | `/api/links/bulk` |
| `POST` | `/api/links/bulk-tag` |

## Import

| Method | Path |
|--------|------|
| `POST` | `/api/import/shlink-api/fetch` |
| `POST` | `/api/import/preview` |
| `POST` | `/api/import/confirm` |
| `GET` | `/api/import/jobs` |
| `GET` | `/api/import/jobs/:id` |
| `GET` | `/api/import/jobs/:id/report.csv` |

## Export

| Method | Path |
|--------|------|
| `GET` | `/api/export/links.csv` |
| `GET` | `/api/export/links.json` |
| `GET` | `/api/export/visits.csv` |
| `GET` | `/api/export/backup.json` |

## Tags And Settings

| Method | Path |
|--------|------|
| `GET` | `/api/tags` |
| `POST` | `/api/tags` |
| `PUT` | `/api/tags/:id` |
| `DELETE` | `/api/tags/:id` |
| `GET` | `/api/settings` |
| `PUT` | `/api/settings` |

## Metadata

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/metadata/title` | Fetch a page title for Create/Edit forms |

## Audit Logs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/audit` | List admin action and import audit events |
