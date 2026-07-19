import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const guideUrl = new URL('../docs/FRESH_ACCOUNT_REHEARSAL.md', import.meta.url);

test('fresh-account guide keeps credential, repository, DNS, and R2 boundaries explicit', async () => {
  const guide = await readFile(guideUrl, 'utf8');
  const ghMutations = guide
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^gh (?:secret|variable) set\b/.test(line));

  assert.ok(ghMutations.length >= 7);
  assert.ok(ghMutations.every((line) => line.includes('--repo $repo')));
  assert.match(guide, /never the Global API Key/i);
  assert.match(guide, /linketry-demo-admin\.pages\.dev/);
  assert.match(guide, /linketry-demo-api\.pages\.dev/);
  assert.match(guide, /DNS only/);
  assert.match(guide, /LINKETRY_DEMO_R2_BUCKET/);
  assert.match(guide, /LINKETRY_DEMO_R2_PREVIEW_BUCKET/);
  assert.match(guide, /does not mean the Cloudflare R2 service itself is disabled/);
});
