# Security

## Secrets

- Do not commit `.dev.vars`.
- Do not commit real `LINKETRY_ADMIN_TOKEN` values.
- Use `wrangler secret put LINKETRY_ADMIN_TOKEN` for production.
- Store the optional `LINKETRY_GITHUB_UPDATE_TOKEN` only as a GitHub repository secret and Worker secret. Restrict it to one repository with `Actions: write`; never expose it through `VITE_*` variables.
- Fresh self-hosting Cloudflare API tokens also need Workers Routes Edit scoped to the selected custom-domain zone; keep R2 and Queues permissions disabled unless those bindings are enabled.
- The manual-only **Sync Online Upgrade Secret** workflow validates the protected account and Worker inventory before writing that one Worker secret; it cannot deploy code or apply migrations.
- Keep migration tokens and Shlink API keys out of source control.

## Admin API

Admin login uses bearer-token auth:

```http
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
```

API tokens are stored as SHA-256 hashes in D1 and can be scoped as `read`, `write`, or `admin`. New token plaintext is returned only once when it is created.

Destructive and egress-capable operations require the **`admin` scope** (or the primary `LINKETRY_ADMIN_TOKEN`):

- Backup list / create / download / restore
- Import confirm (preview remains `write`)
- Bulk link delete and bulk destination URL replace confirm
- Metadata title/suggestions/preview fetches
- Health-check URL probes

All `/api/v1/*` routes must pass through `src/auth/index.ts`. Bearer comparisons use constant-time equality for the admin token.

### Authentication rate limits

`POST /api/v1/auth/login` and password-protected short-link POSTs are rate-limited via `AUTH_RATE_LIMITER` when bound, otherwise `DEMO_RATE_LIMITER` if present, otherwise a KV counter fallback. When no limiter or KV is available, production logs a warning and allows the request; the official Demo continues to fail closed for its dedicated read limiter.

### Link passwords

New link passwords are stored as `pbkdf2:<iterations>:<salt>:<hash>` (PBKDF2-SHA256). Legacy `sha256:` hashes still verify. Minimum password length is 8 characters.

### Outbound fetch (SSRF)

Worker-initiated fetches (metadata, health checks, webhooks) must pass `apps/worker/src/utils/egress.ts`: http(s) only, no credentials, no localhost/private/link-local/metadata hosts, redirect targets re-validated. Short-link destinations may still point at private hosts; only Worker egress is restricted.

### CORS

Set `LINKETRY_CORS_ORIGINS` to a comma-separated allowlist of Admin origins for split-domain deployments. When unset, the Worker falls back to `*` and logs a warning. The official Demo may keep `*`.

### Browser token storage

Admin stores the bearer token in `localStorage`. Any Admin XSS can steal it. Mitigations: Admin Pages CSP/`_headers`, scoped API tokens for automation, and treating XSS as full instance compromise. HttpOnly session cookies are not used in this release.

The online-upgrade dispatch endpoint requires the primary instance Admin token, not a scoped Linketry API token. Repository, workflow, and branch come only from Worker deployment configuration. The browser receives a sanitized run ID, status, conclusion, and GitHub URL, never the GitHub token.

### Official Public Demo Exception

The official Demo sets `LINKETRY_DEMO_MODE=read-only` **and** `LINKETRY_DEMO_ALLOW=1` only in its isolated Worker. Without `LINKETRY_DEMO_ALLOW`, Demo mode fails closed with 503 so production/self-host tracks cannot accidentally open unauthenticated GET APIs. In that mode, GET/HEAD/OPTIONS Admin API requests may run without an owner token so the public can explore synthetic data. Every mutating API method is rejected before routing, the Admin client independently rejects writes, and real redirect visits are not persisted. API reads also pass through a dedicated Cloudflare Rate Limiting binding keyed by a hash of the client address. If that binding is missing or fails, the Demo API fails closed with 503. Demo read responses use `Cache-Control: private, no-store` and `X-Linketry-Demo: synthetic-readonly`.

The Demo Admin asks for `VITE_LINKETRY_DEMO_ACCESS_CODE` before showing the synthetic dashboard. This is a public preview code stored only as a local browser grant; it is **not** API authentication and must not be reused as `LINKETRY_ADMIN_TOKEN`. The Worker API intentionally keeps public read access for a low-friction preview, while its read-only gate and native rate limiter remain the actual API boundary.

Production and normal self-hosted configurations must not set `LINKETRY_DEMO_MODE`. Fresh/upgrade preflight fails when that variable is set. Quick Deploy / one-click builds refuse `LINKETRY_DEMO_MODE`. The Demo workflow also requires a separate Cloudflare account, resource inventory, scoped credentials, and protected production account/resource/domain lists. Its Cloudflare credential should be an account-owned API token restricted to the Demo account with only the bindings the workflow uses: Workers Scripts Edit, Workers KV Storage Edit, D1 Edit, Cloudflare Pages Edit, plus Workers R2 Storage Edit and Queues Edit when those optional resources are enabled. DNS or Workers Routes permissions are only needed when the selected routing mode manages those resources. Never reuse the production deployment token.

Demo advanced-feature fixtures use synthetic values and keep notification channels and webhooks disabled. The post-deployment parity check reads public assets and safe API endpoints only; its mutation probe targets a nonexistent route and must be rejected by Demo middleware before routing. The Demo workflow accepts only an isolated push from `main` or an explicitly confirmed manual run, and fails when its public Admin version, brand assets, read surface, or write boundary does not match the reviewed release.

First-deploy generated admin tokens that appear in Actions logs must be rotated immediately after bootstrap.

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
