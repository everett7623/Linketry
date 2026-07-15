# Legacy Domain Cutover Template

Use this checklist when moving an existing Shlink, Sink, YOURLS, Dub, or other short-link domain to Linketry.

Do not run a cutover casually. The old short domain may already be embedded in public posts, QR codes, email campaigns, and customer workflows.

---

## Deployment Values

Fill this table before starting:

| Item | Value |
|------|-------|
| Admin domain | `admin.example.com` |
| Temporary Linketry short/API domain | `go.example.com` |
| Legacy short domain to migrate | `s.example.com` |
| Linketry Worker | `linketry-worker` |
| Linketry D1 | `linketry` |
| Imported links | `<count>` |
| Current Admin default domain | `go.example.com` |

Keep the temporary Linketry short/API domain available after cutover as a test and fallback domain.

---

## Pre-Cutover Checklist

- [ ] API key used during migration has been revoked or rotated
- [ ] `https://go.example.com/health` returns 200
- [ ] Important slugs work on `https://go.example.com/<slug>`
- [ ] Admin can log in at `https://admin.example.com`
- [ ] Admin Settings has `default_domain=go.example.com` before cutover
- [ ] A fresh Linketry `backup.json` has been exported
- [ ] The old short-link system is still running for rollback
- [ ] High-traffic slugs are listed for quick spot checks

Recommended spot-check command:

```bash
curl -I https://go.example.com/<slug>
```

Expected result:

```txt
HTTP/2 301
location: https://destination.example/path
```

or:

```txt
HTTP/2 302
location: https://destination.example/path
```

---

## Cutover Steps

### 1. Add the legacy domain to Worker routes

Update `apps/worker/wrangler.toml`:

```toml
routes = [
  { pattern = "go.example.com", custom_domain = true },
  { pattern = "s.example.com", custom_domain = true }
]
```

Deploy Worker:

```bash
npm run deploy --workspace=apps/worker
```

### 2. Confirm Cloudflare custom domain status

In Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select the Linketry Worker
3. Confirm both custom domains are active:
   - `go.example.com`
   - `s.example.com`

If Cloudflare asks for DNS changes, follow the dashboard prompt.

### 3. Test the legacy domain

Run:

```bash
curl -I https://s.example.com/health
curl -I https://s.example.com/<important-slug-1>
curl -I https://s.example.com/<important-slug-2>
curl -I https://s.example.com/<important-slug-3>
```

Expected:

- `/health` returns Linketry JSON
- Existing slugs return `301` or `302` to the same destinations as the old system
- Missing slugs return the Linketry 404 page

### 4. Update Admin default domain

After `s.example.com` is confirmed working, update Admin Settings:

```txt
Default Domain: s.example.com
```

This changes Admin copy/open behavior. It does not rewrite imported `short_url` values.

### 5. Smoke test Admin after cutover

In `https://admin.example.com`:

- [ ] Links list loads
- [ ] Copy button copies `https://s.example.com/<slug>`
- [ ] Open button opens `https://s.example.com/<slug>`
- [ ] Create a temporary link and verify redirect
- [ ] Delete the temporary link and verify 404
- [ ] Analytics still records visits

---

## Rollback Plan

If Linketry has a production issue:

1. Remove or disable the `s.example.com` Worker route/custom domain
2. Restore the old DNS or Cloudflare route
3. Change Admin Settings back to:

```txt
Default Domain: go.example.com
```

4. Keep Linketry data intact
5. Investigate with `go.example.com` while the old system serves production traffic

Do not delete the old system immediately after cutover. Keep it for at least 1-2 weeks.

---

## Post-Cutover Tasks

- [ ] Monitor high-traffic slugs
- [ ] Export a fresh backup after the first successful day
- [ ] Check total clicks growth in Linketry
- [ ] Keep the old system available for rollback
- [ ] Update `PROGRESS.md` after the cutover is stable
