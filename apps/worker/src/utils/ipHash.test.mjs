import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
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

const { hashClientIp } = await import('./ipHash.ts');

const ip = '203.0.113.10';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

test('without a secret the IP hash stays the SHA-256 digest that existing rows use', async () => {
  assert.equal(await hashClientIp({}, ip), sha256(ip));
  assert.equal(await hashClientIp({ LINKETRY_IP_HASH_SECRET: '   ' }, ip), sha256(ip));
});

test('a configured secret keys the hash with HMAC-SHA256 in the same 64-hex shape', async () => {
  const secret = 'linketry-test-ip-hash-secret';
  const hash = await hashClientIp({ LINKETRY_IP_HASH_SECRET: secret }, ip);

  assert.equal(hash, createHmac('sha256', secret).update(ip).digest('hex'));
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, sha256(ip));
});

test('surrounding whitespace in the secret is ignored, as for the other Worker secrets', async () => {
  assert.equal(
    await hashClientIp({ LINKETRY_IP_HASH_SECRET: '  secret-a\n' }, ip),
    await hashClientIp({ LINKETRY_IP_HASH_SECRET: 'secret-a' }, ip)
  );
});

test('the keyed hash is stable per secret and changes when the secret rotates', async () => {
  const first = await hashClientIp({ LINKETRY_IP_HASH_SECRET: 'secret-a' }, '2001:db8::1');

  assert.equal(await hashClientIp({ LINKETRY_IP_HASH_SECRET: 'secret-a' }, '2001:db8::1'), first);
  assert.notEqual(await hashClientIp({ LINKETRY_IP_HASH_SECRET: 'secret-b' }, '2001:db8::1'), first);
});
