# Security

## Secrets

- Do not commit `.dev.vars`.
- Do not commit real `ADMIN_TOKEN` values.
- Use `wrangler secret put ADMIN_TOKEN` for production.
- Keep migration tokens and Shlink API keys out of source control.

## Admin API

V1 uses bearer-token auth:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

All `/api/*` routes must pass through `src/auth/index.ts`.

## URL Safety

Long URLs must use `http://` or `https://`.

Rejected examples:

- empty URLs
- invalid URLs
- `javascript:`
- `data:`

Validation lives in `packages/shared/src/validators/index.ts`.

## Slug Safety

Allowed slug characters:

```txt
a-z A-Z 0-9 - _
```

Reserved paths such as `api`, `admin`, `health`, `login`, `settings`, static asset paths, and common metadata files are blocked.

## Redirect Safety

- Redirect stability is the top priority.
- Stats must run through `ctx.waitUntil()`.
- Stats failures must not break redirects.
- KV is a cache only; D1 remains the source of truth.
- Disabled, archived, expired, or max-clicked links must not keep redirecting through stale KV.

## Import Safety

- Preview before import.
- Default conflict strategy is skip.
- Never silently overwrite existing slugs.
- Admin downloads a pre-import backup before confirm import mutates data.

