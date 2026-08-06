/**
 * Post-deploy operator hints for Cloudflare one-click / `npm run deploy`.
 * Runs after remote D1 migrations. Does not mutate Cloudflare or GitHub state.
 */

console.log(`
Linketry post-deploy next steps
-------------------------------
1. Set the Admin login secret (once per instance):
   npx wrangler secret put LINKETRY_ADMIN_TOKEN
   Use one long random token. This is the only required secret for Quick Deploy.

2. Confirm the Worker is healthy:
   curl https://<your-worker>.workers.dev/health

3. Open Admin (Demo mode is forced off on this production profile):
   https://<your-worker>.workers.dev/admin/

4. If something fails, see docs/QUICK_START.md and docs/TROUBLESHOOTING.md.
`);
