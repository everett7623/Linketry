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
const { default: worker } = await import('../index.ts');
const { registerAdminApiRoutes } = await import('./api.ts');
const { default: publicStatsRoutes } = await import('./publicStats.ts');
const { sha256 } = await import('../utils/id.ts');

const ADMIN_TOKEN = 'linketry-test-admin-token-0123456789';
const API_TOKEN = 'linketry-test-api-token-abcdef0123';
const API_TOKEN_HASH = await sha256(API_TOKEN);

/** 按 index.ts 的挂载方式枚举 /api 下全部已注册的方法与路径（路径参数用占位值代替）。 */
function registeredApiRoutes() {
  const app = new Hono();
  app.route('/', publicStatsRoutes);
  registerAdminApiRoutes(app);
  const unique = new Map();
  for (const route of app.routes) {
    if (route.method === 'ALL' || !route.path.startsWith('/api/')) continue;
    const path = route.path.replace(/:[^/]+/g, 'probe-id').replace(/\*/g, 'probe');
    unique.set(`${route.method} ${path}`, { method: route.method, path });
  }
  return [...unique.values()];
}

/** D1/KV doubles: reads come back empty, writes succeed; API token lookups and KV writes are recorded. */
function createEnv() {
  const tokenLookups = [];
  const kvPuts = [];
  const env = {
    LINKETRY_ADMIN_TOKEN: ADMIN_TOKEN,
    LINKETRY_CORS_ORIGINS: 'https://admin.example.com',
    KV: {
      async get() {
        return null;
      },
      async put(key) {
        kvPuts.push(key);
      },
      async delete() {},
      async list() {
        return { keys: [], list_complete: true };
      },
    },
    DB: {
      prepare(sql) {
        let params = [];
        const statement = {
          bind(...values) {
            params = values;
            return statement;
          },
          async first() {
            if (!sql.includes('FROM api_tokens')) return null;
            tokenLookups.push(params[0]);
            return params[0] === API_TOKEN_HASH
              ? {
                  id: 'token_1',
                  name: 'ci',
                  token_hash: API_TOKEN_HASH,
                  scopes: '["read"]',
                  created_at: '2026-10-20T00:00:00.000Z',
                  last_used_at: null,
                  revoked_at: null,
                }
              : null;
          },
          async all() {
            return { results: [] };
          },
          async run() {
            return { success: true, meta: { changes: 0 } };
          },
        };
        return statement;
      },
      async batch(statements) {
        return statements.map(() => ({ success: true, results: [], meta: {} }));
      },
    },
  };
  return { env, tokenLookups, kvPuts };
}

async function send(method, path, { headers = {}, body } = {}, env = createEnv().env) {
  const pending = [];
  const ctx = {
    waitUntil(promise) {
      pending.push(Promise.resolve(promise).catch(() => {}));
    },
    passThroughOnException() {},
  };
  const response = await worker.fetch(
    new Request(`https://go.example.com${path}`, { method, headers, body }),
    env,
    ctx
  );
  await Promise.all(pending);
  return response;
}

const json = { 'Content-Type': 'application/json' };

test('every Admin API route rejects anonymous requests except sign-in and sign-out', async () => {
  const routes = registeredApiRoutes();
  assert.ok(routes.length > 100, `route table looks incomplete: ${routes.length} routes`);

  const reachable = [];
  for (const { method, path } of routes) {
    if (/\/auth\/(login|logout)$/.test(path)) continue;
    const init = method === 'GET' ? {} : { headers: json, body: '{}' };
    const response = await send(method, path, init);
    if (response.status !== 401 && response.status !== 403) {
      reachable.push(`${method} ${path} -> ${response.status}`);
    }
  }
  assert.deepEqual(reachable, []);
});

test('sign-in is reachable without a bearer header and its rate limit counts failed attempts', async () => {
  for (const prefix of ['/api/v1', '/api']) {
    const { env, kvPuts } = createEnv();
    const login = (body) => send('POST', `${prefix}/auth/login`, { headers: json, body }, env);

    const malformed = await login('{not json');
    assert.equal(malformed.status, 400, prefix);
    assert.equal((await malformed.json()).error, 'Invalid request body', prefix);

    const wrong = await login(JSON.stringify({ token: 'wrong-token' }));
    assert.equal(wrong.status, 401, prefix);
    assert.equal((await wrong.json()).error, 'Invalid token', prefix);

    const signedIn = await login(JSON.stringify({ token: ADMIN_TOKEN }));
    assert.equal(signedIn.status, 200, prefix);

    const counted = kvPuts.filter((key) => key.startsWith('linketry:ratelimit:auth:login:'));
    assert.equal(counted.length, 3, `${prefix}: every attempt goes through the login limiter`);
  }
});

test('an API token is verified once per request', async () => {
  const { env, tokenLookups } = createEnv();
  const response = await send(
    'GET',
    '/api/v1/tags',
    { headers: { Authorization: `Bearer ${API_TOKEN}` } },
    env
  );

  assert.equal(response.status, 200);
  assert.deepEqual(tokenLookups, [API_TOKEN_HASH]);
});

test('the OpenAPI document and API docs still require a token', async () => {
  for (const path of ['/api/v1/openapi.json', '/api/v1/docs']) {
    assert.equal((await send('GET', path)).status, 401, path);
    const authorized = await send('GET', path, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    assert.equal(authorized.status, 200, path);
  }
});
