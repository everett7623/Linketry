/**
 * Post-deploy operator hints for Cloudflare one-click / `npm run deploy`.
 * Runs after remote D1 migrations. Does not mutate Cloudflare or GitHub state.
 */

console.log(`
Linketry post-deploy next steps
-------------------------------
1. Confirm the Admin login secret is already set:
   Quick Deploy: use the LINKETRY_ADMIN_TOKEN you entered in the Cloudflare form.
   Manual Wrangler: npx wrangler secret put LINKETRY_ADMIN_TOKEN
   Reviewed GitHub Actions: gh secret set LINKETRY_ADMIN_TOKEN --repo OWNER/REPOSITORY
   Use one long random token. Never paste it into chat, source files, or Actions logs.

2. Confirm the Worker is healthy:
   curl https://<your-worker>.workers.dev/health

3. Open Admin (Demo mode is forced off on this production profile):
   https://<your-worker>.workers.dev/admin/

4. If something fails, see docs/QUICK_START.md and docs/TROUBLESHOOTING.md.
`);
