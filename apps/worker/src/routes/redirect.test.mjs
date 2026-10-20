import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Resolve the codebase's extensionless relative imports when type-stripping .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !extname(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { Hono } = await import('hono');
const { handleRedirect } = await import('./redirect.ts');
const { hashLinkPassword } = await import('../utils/password.ts');
const { rateLimiterFailureResult } = await import('../auth/rateLimit.ts');

const app = new Hono();
app.get('/:slug', handleRedirect);
app.post('/:slug', handleRedirect);

const cachedEntry = {
  id: 'link_1',
  slug: 'promo',
  domain: 'go.example.com',
  longUrl: 'https://example.com/landing?ref=cache',
  redirectType: 302,
  status: 'active',
  warningEnabled: false,
};

function linkRow(overrides = {}) {
  return {
    id: 'link_1',
    slug: 'promo',
    domain: 'go.example.com',
    long_url: 'https://example.com/landing?ref=d1',
    short_url: 'https://go.example.com/promo',
    title: null,
    description: null,
    tags: null,
    status: 'active',
    redirect_type: 302,
    clicks: 0,
    source: null,
    source_id: null,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    last_clicked_at: null,
    expires_at: null,
    max_clicks: null,
    password_hash: null,
    warning_enabled: 0,
    fallback_url: null,
    archived: 0,
    ...overrides,
  };
}

/** D1/KV doubles: only the link lookup is scripted; everything else reads empty and writes succeed. */
function createEnv({ cached = null, link = null, linkLookupError = null, kvPutError = null } = {}) {
  return {
    KV: {
      async get(key) {
        return key.startsWith('linketry:slug:') ? cached : null;
      },
      async put() {
        if (kvPutError) throw kvPutError;
      },
      async delete() {},
    },
    DB: {
      prepare(sql) {
        const statement = {
          bind() {
            return statement;
          },
          async first() {
            if (sql.includes('FROM links')) {
              if (linkLookupError) throw linkLookupError;
              return link;
            }
            return null;
          },
          async all() {
            return { results: [] };
          },
          async run() {
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
      async batch() {
        return [];
      },
    },
  };
}

async function visit(path, env, init = {}) {
  const pending = [];
  const ctx = {
    waitUntil(promise) {
      pending.push(Promise.resolve(promise).catch(() => {}));
    },
    passThroughOnException() {},
  };
  const response = await app.request(`https://go.example.com${path}`, init, env, ctx);
  await Promise.all(pending);
  return response;
}

function submitPassword(password) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'CF-Connecting-IP': '203.0.113.10' },
    body: new URLSearchParams({ password }).toString(),
  };
}

const d1Unavailable = new Error('D1_ERROR: storage temporarily unavailable');

test('a KV hit re-checks D1 and redirects to its destination with query parameters', async () => {
  const response = await visit(
    '/promo?utm_source=newsletter',
    createEnv({ cached: cachedEntry, link: linkRow() })
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://example.com/landing?ref=d1&utm_source=newsletter');
});

test('a stale active cache entry cannot bypass a disable recorded in D1', async () => {
  const response = await visit('/promo', createEnv({ cached: cachedEntry, link: linkRow({ status: 'disabled' }) }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Location'), null);
  assert.match(await response.text(), /Link Disabled/);
});

test('with D1 unavailable the cached destination keeps redirecting and forwards query parameters (H4)', async () => {
  const response = await visit(
    '/promo?utm_source=newsletter&linketry_confirm=1',
    createEnv({ cached: cachedEntry, linkLookupError: d1Unavailable })
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://example.com/landing?ref=cache&utm_source=newsletter');
});

test('with D1 unavailable the fallback still refuses limited, expired or inactive cache entries', async () => {
  const refused = [
    { ...cachedEntry, maxClicks: 10 },
    { ...cachedEntry, expiresAt: '2020-01-01T00:00:00.000Z' },
    { ...cachedEntry, status: 'disabled' },
  ];

  for (const cached of refused) {
    const response = await visit('/promo', createEnv({ cached, linkLookupError: d1Unavailable }));
    assert.equal(response.status, 404, JSON.stringify(cached));
    assert.equal(response.headers.get('Location'), null);
  }
});

test('with D1 unavailable a cached warning link still shows the confirmation page', async () => {
  const response = await visit(
    '/promo',
    createEnv({ cached: { ...cachedEntry, warningEnabled: true }, linkLookupError: d1Unavailable })
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Location'), null);
  assert.match(await response.text(), /linketry_confirm=1/);
});

test('a failing password rate limiter never falls back to a stale cached redirect', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const link = linkRow({ password_hash: await hashLinkPassword('correct horse battery staple') });
  const kvPutError = new Error('KV put() limit exceeded for the day.');
  const failOpen = rateLimiterFailureResult('link-password').allowed;

  // KV hit: the entry predates the password and is still being served by some PoP.
  for (const cached of [cachedEntry, null]) {
    const response = await visit('/promo', createEnv({ cached, link, kvPutError }), submitPassword('wrong password'));

    assert.equal(response.headers.get('Location'), null, `cached=${!!cached}`);
    // fail-open checks the password (wrong → 401 page); fail-closed answers 503.
    assert.equal(response.status, failOpen ? 401 : 503, `cached=${!!cached}`);
  }
});

test('the correct password still redirects when the limiter works', async () => {
  const link = linkRow({ password_hash: await hashLinkPassword('correct horse battery staple') });
  const response = await visit(
    '/promo?utm_source=newsletter',
    createEnv({ link }),
    submitPassword('correct horse battery staple')
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), 'https://example.com/landing?ref=d1&utm_source=newsletter');
});
