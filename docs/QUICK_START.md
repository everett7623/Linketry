# Linketry Quick Start

Deploy your own Linketry instance in a few minutes with the Cloudflare Deploy Button.

---

## What you need

- A Cloudflare account (free tier works)
- About 5 minutes

No custom domain required to start — your instance gets a `*.workers.dev` URL automatically.

---

## One secret: `LINKETRY_ADMIN_TOKEN`

Quick Deploy asks for a single Worker secret: **`LINKETRY_ADMIN_TOKEN`**.

- Choose a long random string (20+ characters) and store it in a password manager.
- That value is your Admin login. There is no separate default password.
- Do not reuse the public Demo preview code, and do not enable Demo mode on your instance.

Demo mode is **forced off** on this production profile (`VITE_LINKETRY_DEMO_MODE=false`). The official Demo at [demo.linketry.com](https://demo.linketry.com) is a separate track with synthetic data — it is not your deployment.

---

## Step 1 — Click Deploy

Visit [linketry.com/deploy](https://linketry.com/deploy) and click **Deploy to Cloudflare**.

Cloudflare creates in your account:

- A Worker (short-link redirects + Admin API + bundled Admin at `/admin/`)
- A D1 database (source of truth for your links)
- A KV namespace (redirect cache only)

Enter `LINKETRY_ADMIN_TOKEN` when Cloudflare prompts for it.

---

## Step 2 — Verify health

After deployment finishes:

```bash
curl https://<your-worker-name>.workers.dev/health
```

You should see a JSON envelope with `"status":"ok"` and the deployed version.

If you get an error, wait about 30 seconds and retry — Workers can take a moment to propagate. More checks: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Step 3 — Open Admin at `/admin/`

```
https://<your-worker-name>.workers.dev/admin/
```

Use the trailing `/admin/` path (same-origin Admin assets live under that prefix). Log in with the `LINKETRY_ADMIN_TOKEN` from Step 1.

The **Setup** page guides you through:

1. Confirming the Worker API is reachable
2. Optionally adding a custom short domain
3. Creating your first short link

---

## Add a custom short domain (optional)

If you want `go.yourdomain.com` instead of `*.workers.dev`:

1. Cloudflare Dashboard → Workers & Pages → your worker → Settings → Domains & Routes → **Add Custom Domain**
2. Enter `go.yourdomain.com`
3. In Linketry Admin → Settings → set the default short domain to `go.yourdomain.com`

Your `*.workers.dev` URL keeps working as a fallback.

---

## Need GitHub Actions, a custom domain, or AI help?

Use the [deployment options page](https://linketry.com/deploy/). Path B copies a guarded assistant prompt that follows `docs/SELF_HOSTING.md`: dry-runs first, hidden secret prompts, and `gh secret set LINKETRY_ADMIN_TOKEN` before the first workflow run. The prompt must not put tokens in chat, source files, logs, or command arguments.

---

## Upgrade to a newer version

From the Admin sidebar → version status → **Upgrade**. Linketry can update itself if `LINKETRY_GITHUB_UPDATE_TOKEN` is configured (see `docs/SELF_HOSTING.md`). Otherwise use the **Open deployment** link to trigger a GitHub Actions run manually.

---

## Troubleshooting

If `/health` fails, Admin will not load, or login returns 401:

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Quick Deploy, Worker access, CORS, and migration failures
- [SUPPORT.md](../SUPPORT.md) — supported release line and how to ask for help

---

## Need more control?

For a dedicated Admin domain, R2 backups, Queue-based visit processing, and full GitHub Actions automation (reviewed dry-runs + confirmation phrases), see:

- [SELF_HOSTING.md](SELF_HOSTING.md) — complete self-hosting guide (Quick vs Reviewed)
- [DEPLOYMENT_PREFLIGHT.md](DEPLOYMENT_PREFLIGHT.md) — pre-deployment safety checks
- [FRESH_ACCOUNT_REHEARSAL.md](FRESH_ACCOUNT_REHEARSAL.md) — owner checklist for a fresh Cloudflare account
