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

const { checkAuthRateLimit, rateLimiterFailureResult } = await import('./rateLimit.ts');

const BUCKETS = ['login', 'link-password'];

function attempt(ip = '203.0.113.10') {
  return new Request('https://go.example.com/promo', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip },
  });
}

function memoryKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

const quotaExhaustedKv = {
  async get() {
    return null;
  },
  async put() {
    throw new Error('KV put() limit exceeded for the day.');
  },
};

test('KV counters allow 20 attempts per client per minute and then block', async () => {
  const kv = memoryKv();
  for (let index = 0; index < 20; index++) {
    assert.equal((await checkAuthRateLimit({ KV: kv }, attempt(), 'login')).allowed, true);
  }

  const blocked = await checkAuthRateLimit({ KV: kv }, attempt(), 'login');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.source, 'kv');
  assert.equal(
    (await checkAuthRateLimit({ KV: kv }, attempt('198.51.100.7'), 'login')).allowed,
    true,
    'another client keeps its own counter'
  );
});

for (const bucket of BUCKETS) {
  test(`${bucket}: the failure policy reports the unavailable source`, () => {
    const result = rateLimiterFailureResult(bucket);
    assert.equal(result.source, 'unavailable');
    assert.equal(typeof result.allowed, 'boolean');
    assert.ok(result.retryAfterSeconds > 0);
  });

  test(`${bucket}: an exhausted KV counter resolves through the failure policy instead of throwing`, async (t) => {
    const warn = t.mock.method(console, 'warn', () => {});
    const result = await checkAuthRateLimit({ KV: quotaExhaustedKv }, attempt(), bucket);

    assert.deepEqual(result, rateLimiterFailureResult(bucket));
    assert.equal(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Auth rate limiter failed/);
  });

  test(`${bucket}: a failing Rate Limiting binding resolves through the same policy`, async (t) => {
    t.mock.method(console, 'warn', () => {});
    const limiter = {
      async limit() {
        throw new Error('binding unavailable');
      },
    };

    assert.deepEqual(
      await checkAuthRateLimit({ AUTH_RATE_LIMITER: limiter }, attempt(), bucket),
      rateLimiterFailureResult(bucket)
    );
  });
}

test('without a limiter binding or KV the attempt is allowed and marked open', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const result = await checkAuthRateLimit({}, attempt(), 'login');
  assert.equal(result.allowed, true);
  assert.equal(result.source, 'open');
});
