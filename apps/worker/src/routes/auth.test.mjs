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
const { default: authRoutes } = await import('./auth.ts');
const { rateLimiterFailureResult } = await import('../auth/rateLimit.ts');

const app = new Hono();
app.route('/api/v1/auth', authRoutes);

const ADMIN_TOKEN = 'linketry-test-admin-token-0123456789';

function createEnv({ kvPutError = null } = {}) {
  return {
    LINKETRY_ADMIN_TOKEN: ADMIN_TOKEN,
    KV: {
      async get() {
        return null;
      },
      async put() {
        if (kvPutError) throw kvPutError;
      },
    },
  };
}

async function login(body, env = createEnv()) {
  const response = await app.request(
    'https://go.example.com/api/v1/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.10' },
      body,
    },
    env
  );
  return { status: response.status, body: await response.json() };
}

test('the admin token signs in', async () => {
  const result = await login(JSON.stringify({ token: ADMIN_TOKEN }));
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});

test('a malformed body is still reported as an invalid request body', async () => {
  assert.deepEqual(await login('{not json'), {
    status: 400,
    body: { success: false, error: 'Invalid request body' },
  });
});

test('a missing or non-string token is rejected before comparison', async () => {
  for (const body of [{}, { token: 12345 }, null]) {
    assert.deepEqual(await login(JSON.stringify(body)), {
      status: 400,
      body: { success: false, error: 'Token is required' },
    });
  }
});

test('a wrong token is rejected', async () => {
  const result = await login(JSON.stringify({ token: 'wrong-token' }));
  assert.equal(result.status, 401);
  assert.equal(result.body.error, 'Invalid token');
});

test('a failing rate limiter is no longer reported as an invalid request body', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const result = await login(
    JSON.stringify({ token: ADMIN_TOKEN }),
    createEnv({ kvPutError: new Error('KV put() limit exceeded for the day.') })
  );

  assert.notEqual(result.body.error, 'Invalid request body');
  if (rateLimiterFailureResult('login').allowed) {
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
  } else {
    assert.equal(result.status, 503);
    assert.match(result.body.error, /temporarily unavailable/);
  }
});
