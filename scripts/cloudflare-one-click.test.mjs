import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('Cloudflare one-click profile provisions only a normal production instance', async () => {
  const [configSource, rootEnv, adminEnv, packageSource] = await Promise.all([
    read('wrangler.jsonc'),
    read('.env.example'),
    read('apps/admin/.env.example'),
    read('package.json'),
  ]);
  const parsedConfig = ts.parseConfigFileTextToJson('wrangler.jsonc', configSource);
  assert.equal(parsedConfig.error, undefined);
  const config = parsedConfig.config;
  const packageJson = JSON.parse(packageSource);

  assert.equal(config.name, 'linketry');
  assert.equal(config.workers_dev, true);
  assert.equal(config.d1_databases[0].binding, 'DB');
  assert.equal(config.kv_namespaces[0].binding, 'KV');
  assert.equal(config.d1_databases[0].database_name, 'linketry-db');
  assert.equal(config.d1_databases[0].database_id, '00000000-0000-4000-8000-000000000001');
  assert.equal(config.kv_namespaces[0].id, '00000000000000000000000000000001');
  assert.match(config.d1_databases[0].database_name, /^linketry-[a-z0-9-]+$/);
  assert.match(
    config.d1_databases[0].database_id,
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/
  );
  assert.match(config.kv_namespaces[0].id, /^[a-f0-9]{32}$/);
  assert.notEqual(config.d1_databases[0].database_id.trim(), '');
  assert.notEqual(config.kv_namespaces[0].id.trim(), '');
  assert.equal(config.assets.directory, 'apps/admin/dist');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.doesNotMatch(configSource, /DEMO|demo|pages/i);

  assert.deepEqual(
    rootEnv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
    ['LINKETRY_ADMIN_TOKEN=']
  );
  assert.doesNotMatch(`${rootEnv}\n${adminEnv}`, /LINKETRY_DEMO_|demo/i);
  assert.equal(packageJson.scripts.build, 'node scripts/build-cloudflare-one-click.mjs');
  assert.equal(packageJson.scripts.deploy, 'wrangler deploy');
  assert.equal(packageJson.scripts.postdeploy, 'wrangler d1 migrations apply DB --remote');
  assert.match(packageJson.cloudflare.bindings.LINKETRY_ADMIN_TOKEN.description, /production/i);
});

test('bundled Admin is isolated under /admin before the slug catch-all', async () => {
  const [worker, adminMain, brandMark, viteConfig, buildScript] = await Promise.all([
    read('apps/worker/src/index.ts'),
    read('apps/admin/src/main.tsx'),
    read('apps/admin/src/components/BrandMark.tsx'),
    read('apps/admin/vite.config.ts'),
    read('scripts/build-cloudflare-one-click.mjs'),
  ]);

  assert.ok(worker.indexOf("app.get('/admin/*'") < worker.indexOf('// Slug redirect - catch all'));
  assert.match(worker, /if \(!c\.env\.ASSETS\) return bundledAdminNotFound\(c\)/);
  assert.match(worker, /url\.pathname = '\/admin\/'/);
  assert.match(adminMain, /BrowserRouter basename=\{routerBaseName\}/);
  assert.match(brandMark, /import\.meta\.env\.BASE_URL/);
  assert.match(viteConfig, /VITE_LINKETRY_BASE_PATH === '\/admin\/'/);
  assert.match(buildScript, /VITE_LINKETRY_BASE_PATH: '\/admin\/'/);
  assert.match(buildScript, /VITE_LINKETRY_API_URL: ''/);
  assert.match(buildScript, /VITE_LINKETRY_DEMO_MODE: 'false'/);
  assert.match(buildScript, /VITE_LINKETRY_DEMO_ACCESS_CODE: ''/);
});
