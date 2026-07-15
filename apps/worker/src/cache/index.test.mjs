import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteCachedLink, getCachedLink } from './index.ts';

test('reads the legacy Linkora cache key when the Linketry key is empty', async () => {
  const calls = [];
  const entry = { id: 'link_1', slug: 'demo', long_url: 'https://example.com' };
  const env = {
    KV: {
      async get(key) {
        calls.push(key);
        return key.startsWith('linkora:') ? entry : null;
      },
    },
  };

  assert.equal(await getCachedLink(env, 'go.example.com', 'demo'), entry);
  assert.deepEqual(calls, [
    'linketry:slug:go.example.com:demo',
    'linkora:slug:go.example.com:demo',
  ]);
});

test('deletes both cache generations after a link mutation', async () => {
  const deleted = [];
  const env = {
    KV: {
      async delete(key) {
        deleted.push(key);
      },
    },
  };

  await deleteCachedLink(env, 'go.example.com', 'demo');

  assert.deepEqual(
    deleted.sort(),
    ['linketry:slug:go.example.com:demo', 'linkora:slug:go.example.com:demo'].sort()
  );
});
