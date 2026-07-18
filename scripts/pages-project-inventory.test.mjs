import assert from 'node:assert/strict';
import test from 'node:test';
import { hasPagesProject } from './pages-project-inventory.mjs';

test('finds a project in Wrangler 4.111 JSON output', () => {
  const inventory = JSON.stringify([
    { 'Project Name': 'linketry-demo-admin', 'Project Domains': 'demo.linketry.com' },
    { 'Project Name': 'linketry-demo-api', 'Project Domains': 'demoapi.linketry.com' },
  ]);

  assert.equal(hasPagesProject(inventory, 'linketry-demo-api'), true);
  assert.equal(hasPagesProject(inventory, 'linketry-demo-missing'), false);
});

test('accepts the Cloudflare API name field for compatibility', () => {
  const inventory = JSON.stringify({ result: [{ name: 'linketry-demo-api' }] });

  assert.equal(hasPagesProject(inventory, 'linketry-demo-api'), true);
});

test('fails closed on malformed inventory', () => {
  assert.throws(() => hasPagesProject('{}', 'linketry-demo-api'), /Invalid Cloudflare Pages/);
  assert.throws(() => hasPagesProject('not-json', 'linketry-demo-api'), /Unexpected token/);
});
