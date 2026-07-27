import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/ci.yml', import.meta.url);

test('PR CI is read-only and covers the complete pre-merge validation matrix', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(workflow, /\n  pull_request:\s*\n/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request_target|\n  push:/);
  assert.match(workflow, /permissions:\s*\n  contents: read/);
  assert.doesNotMatch(workflow, /secrets\.|vars\.|environment:/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v4/);

  for (const command of [
    'npm run test:deployment',
    'npm run test --workspace=apps/demo-api',
    'npm run test:site',
    'npm run build:site',
    'npm run type-check --workspace=apps/worker',
    'npm run test:worker',
    'npm run test:unit --workspace=apps/admin',
    'npm run test:smoke --workspace=apps/admin',
    'npm run test:production --workspace=apps/admin',
    'npm run build',
  ]) {
    assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(workflow, /VITE_LINKETRY_DEMO_MODE: 'false'/);
  assert.match(workflow, /VITE_LINKETRY_DEMO_MODE: 'true'/);
  const wranglerCommands = workflow.match(/npx wrangler [^\n]+/g) ?? [];
  assert.deepEqual(wranglerCommands, ['npx wrangler deploy --dry-run']);
  assert.doesNotMatch(workflow, /d1 migrations apply|d1 execute|pages deploy|secret put/);
});
