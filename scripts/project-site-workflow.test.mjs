import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/deploy-site.yml', import.meta.url);

test('project-site workflow is manual, exact-commit bound, and Pages-only', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const gateIndex = workflow.indexOf('name: Verify exact site release');
  const deployIndex = workflow.indexOf('name: Deploy only the project site');

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s+push:/);
  assert.match(workflow, /if: github\.repository == 'everett7623\/Linketry'/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v4/);
  assert.match(workflow, /DEPLOY LINKETRY SITE/);
  assert.match(workflow, /LINKETRY_SITE_APPROVED_COMMIT.*GITHUB_SHA/s);
  assert.match(workflow, /LINKETRY_SITE_PROJECT" != "linketry-site"/);
  assert.ok(gateIndex >= 0 && gateIndex < deployIndex);

  const wranglerWrites = workflow.match(/npx wrangler [^\n]+/g) ?? [];
  assert.deepEqual(wranglerWrites, [
    'npx wrangler pages deploy apps/site/dist --project-name "$LINKETRY_SITE_PROJECT" --branch main --commit-hash "$GITHUB_SHA"',
  ]);
  assert.doesNotMatch(workflow, /apps\/worker|apps\/admin|deploy-demo|d1 migrations|dns_records/);
  assert.match(workflow, /npm run test:site/);
  assert.match(workflow, /npm run build:site/);
});
