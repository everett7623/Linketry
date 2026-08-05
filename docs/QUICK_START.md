# Linketry Quick Start

Deploy your own Linketry instance in 3 steps using the Cloudflare Deploy Button.

---

## What you need

- A Cloudflare account (free tier works)
- 5 minutes

No custom domain required to start — your instance gets a `*.workers.dev` URL automatically.

---

## Step 1 — Click Deploy

Visit [linketry.com/deploy](https://linketry.com/deploy) and click **Deploy to Cloudflare**.

Cloudflare will automatically create in your account:
- A Worker (short-link redirects + Admin API)
- A D1 database (stores your links)
- A KV namespace (redirect cache layer)

During setup you will be asked to set **`LINKETRY_ADMIN_TOKEN`** — this is your Admin login password. Choose a long random string (20+ characters) and keep it in a password manager.

---

## Step 2 — Verify

After deployment finishes, check that your instance is healthy:

```
https://<your-worker-name>.workers.dev/health
```

You should see `{"status":"ok","version":"0.30.7"}`.

If you get an error, wait 30 seconds and retry — Workers can take a moment to propagate.

---

## Step 3 — Log in

Open the Admin panel:

```
https://<your-worker-name>.workers.dev/admin
```

Enter the `LINKETRY_ADMIN_TOKEN` from Step 1.

The **Setup** page will guide you through:
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

## Upgrade to a newer version

From the Admin sidebar → version status → **Upgrade**. Linketry can update itself if `LINKETRY_GITHUB_UPDATE_TOKEN` is configured (see `docs/SELF_HOSTING.md`). Otherwise use the **Open deployment** link to trigger a GitHub Actions run manually.

---

## Need more control?

For deployments with a dedicated Admin domain, R2 backups, Queue-based visit processing, and full GitHub Actions automation, see:

- [SELF_HOSTING.md](SELF_HOSTING.md) — complete self-hosting guide
- [DEPLOYMENT_PREFLIGHT.md](DEPLOYMENT_PREFLIGHT.md) — pre-deployment safety checks
