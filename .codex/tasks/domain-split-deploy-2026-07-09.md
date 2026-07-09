# Domain Split Deployment Safety — 2026-07-09

## Status

Done.

## Scope

- Stabilized the deployment model around three roles:
  - `admin.*` for the Admin UI
  - `go.*` for the Worker API
  - `s.*` for public short links
- Added `LINKORA_WORKER_DOMAINS` so GitHub Actions can generate multiple Worker custom domains in `wrangler.toml`.
- Kept `LINKORA_SHORT_DOMAIN` as a backward-compatible single-domain fallback.
- Added a browser-stored Admin API Origin override on the login screen for recovery from bad Admin build variables.
- Added Admin auth startup fallback from a stale browser API Origin override to the build-time API URL.
- Bumped Linkora from `0.7.3` to `0.7.4`.

## Verification

- GitHub repository variables updated for split domains:
  - `LINKORA_API_URL=https://go.y8o.de`
  - `LINKORA_WORKER_DOMAINS=go.y8o.de,s.y8o.de`
  - `LINKORA_SHORT_DOMAIN=go.y8o.de` as a legacy fallback
- `npm run type-check --workspace=apps/worker` passed.
- `npm run build --workspace=apps/admin` passed.
- `git diff --check` passed with only existing LF/CRLF warnings.
- Production `https://go.y8o.de/health` still reports `0.7.3`; deploy is still required for this fix to take effect.
- Production `https://s.y8o.de/*` currently resets the TLS connection; retry after the `0.7.4` deploy binds `s.y8o.de` to the Worker.
