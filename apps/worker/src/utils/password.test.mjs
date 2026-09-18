import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashLinkPassword,
  importedPasswordHashError,
  isAcceptableStoredPasswordHash,
  timingSafeEqualString,
  validateLinkPasswordInput,
  verifyLinkPassword,
} from './password.ts';

test('validateLinkPasswordInput enforces minimum length 8', () => {
  assert.match(validateLinkPasswordInput('short').error ?? '', /at least 8/);
  assert.equal(validateLinkPasswordInput('longenough').password, 'longenough');
  assert.equal(validateLinkPasswordInput('').clear, true);
});

test('pbkdf2 password hashes verify and reject mismatches', async () => {
  const stored = await hashLinkPassword('correct-horse');
  assert.match(stored, /^pbkdf2:100000:[0-9a-f]+:[0-9a-f]+$/);
  assert.equal(await verifyLinkPassword(stored, 'correct-horse'), true);
  assert.equal(await verifyLinkPassword(stored, 'wrong-password'), false);
});

test('legacy sha256 password hashes still verify', async () => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('legacy-pass'));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  assert.equal(await verifyLinkPassword(`sha256:${hex}`, 'legacy-pass'), true);
  assert.equal(await verifyLinkPassword(`sha256:${hex}`, 'nope'), false);
});

test('pbkdf2 verification rejects oversized iteration counts without deriving', async () => {
  const started = Date.now();
  assert.equal(
    await verifyLinkPassword('pbkdf2:1000000000:00:00', 'correct-horse'),
    false
  );
  assert.ok(Date.now() - started < 200);
});

test('imported password hashes reject hostile PBKDF2 parameters', async () => {
  const valid = await hashLinkPassword('correct-horse');
  assert.equal(isAcceptableStoredPasswordHash(valid), true);
  assert.equal(importedPasswordHashError(valid), undefined);
  assert.match(
    importedPasswordHashError('pbkdf2:1000000000:aabb:ccdd') ?? '',
    /supported Linketry hash/
  );
  assert.equal(importedPasswordHashError('sha256:not-hex'), 'password_hash is not a supported Linketry hash');
});

test('timingSafeEqualString compares equal and unequal secrets', () => {
  assert.equal(timingSafeEqualString('abc', 'abc'), true);
  assert.equal(timingSafeEqualString('abc', 'abd'), false);
  assert.equal(timingSafeEqualString('abc', 'ab'), false);
});
