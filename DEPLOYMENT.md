# Linketry Deployment

Maintainer and operator deployment entry point.

| Path | Use |
| ---- | --- |
| [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) | Fresh self-hosting, Quick Deploy, reviewed GitHub Actions, manual Wrangler/Pages, smoke tests |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment track boundaries, CI secrets, bootstrap/preflight commands |
| [docs/DEPLOYMENT_PREFLIGHT.md](docs/DEPLOYMENT_PREFLIGHT.md) | Per-track safety gates before Cloudflare writes |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Cloudflare Deploy Button only |
| [docs/UPGRADING_PRE_0_10.md](docs/UPGRADING_PRE_0_10.md) | Non-destructive upgrade for installs older than 0.10 |
| [docs/CUTOVER.md](docs/CUTOVER.md) | Legacy short-domain cutover checklist |

Do not reuse maintainer production or Demo resource IDs, tokens, or `LINKETRY_DEMO_MODE` on a real instance.
