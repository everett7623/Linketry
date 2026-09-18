import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteCachedLink, getCachedLink, toCacheEntry } from './index.ts';

test('reads the Linketry cache key', async () => {
  const calls = [];
  const entry = { id: 'link_1', slug: 'demo', long_url: 'https://example.com' };
  const env = {
    KV: {
      async get(key) {
        calls.push(key);
        return key.startsWith('linketry:') ? entry : null;
      },
    },
  };

  assert.equal(await getCachedLink(env, 'go.example.com', 'demo'), entry);
  assert.deepEqual(calls, ['linketry:slug:go.example.com:demo']);
});

test('toCacheEntry maps a D1 link onto the KV cache shape', () => {
  assert.deepEqual(
    toCacheEntry(
      {
        id: 'link_1',
        slug: 'demo',
        domain: 'go.example.com',
        long_url: 'https://example.com',
        short_url: 'https://go.example.com/demo',
        title: null,
        description: null,
        tags: null,
        status: 'active',
        redirect_type: 302,
        clicks: 0,
        source: null,
        source_id: null,
        created_at: '2026-09-18T00:00:00.000Z',
        updated_at: '2026-09-18T00:00:00.000Z',
        last_clicked_at: null,
        expires_at: '2026-10-01T00:00:00.000Z',
        max_clicks: 10,
        password_hash: null,
        warning_enabled: 1,
        fallback_url: null,
        archived: 0,
      },
      'disabled'
    ),
    {
      id: 'link_1',
      slug: 'demo',
      domain: 'go.example.com',
      longUrl: 'https://example.com',
      redirectType: 302,
      status: 'disabled',
      expiresAt: '2026-10-01T00:00:00.000Z',
      maxClicks: 10,
      warningEnabled: true,
    }
  );
});

test('deletes the Linketry cache key after a link mutation', async () => {
  const deleted = [];
  const env = {
    KV: {
      async delete(key) {
        deleted.push(key);
      },
    },
  };

  await deleteCachedLink(env, 'go.example.com', 'demo');

  assert.deepEqual(deleted, ['linketry:slug:go.example.com:demo']);
});
