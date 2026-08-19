import { readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const adminDist = new URL('../apps/admin/dist/', import.meta.url);

await rm(adminDist, { recursive: true, force: true });

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('Run the Cloudflare one-click build through npm so the npm CLI is available.');
}

if (process.env.LINKETRY_DEMO_MODE?.trim()) {
  throw new Error(
    'LINKETRY_DEMO_MODE must not be set for Cloudflare Quick Deploy / one-click builds.'
  );
}

const build = spawnSync(process.execPath, [npmCli, 'run', 'build', '--workspace=apps/admin'], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    VITE_LINKETRY_API_URL: '',
    VITE_LINKETRY_BASE_PATH: '/admin/',
    VITE_LINKETRY_DEMO_MODE: 'false',
    VITE_LINKETRY_DEMO_ACCESS_CODE: '',
  },
  stdio: 'inherit',
});

if (build.status !== 0) {
  process.exitCode = build.status ?? 1;
} else {
  const nestedHeaders = new URL('./admin/_headers', adminDist);
  const headers = (await readFile(nestedHeaders, 'utf8')).replace(
    /^\/assets\/\*/m,
    '/admin/assets/*'
  );
  await writeFile(new URL('./_headers', adminDist), headers);
  await unlink(nestedHeaders);

  const html = await readFile(new URL('./admin/index.html', adminDist), 'utf8');
  if (!html.includes('/admin/assets/')) {
    throw new Error('Cloudflare one-click Admin build is not rooted at /admin/.');
  }
  console.log('Cloudflare one-click Admin prepared at /admin/.');
  console.log(`
Next steps after Cloudflare Deploy finishes:
  1. Log in with the LINKETRY_ADMIN_TOKEN you entered in the Cloudflare form
     (manual fallback: wrangler secret put LINKETRY_ADMIN_TOKEN)
  2. curl https://<your-worker>.workers.dev/health
  3. Open https://<your-worker>.workers.dev/admin/
  Demo mode is forced off for this production profile (VITE_LINKETRY_DEMO_MODE=false).
  See docs/QUICK_START.md if login or health checks fail.
`);
}
