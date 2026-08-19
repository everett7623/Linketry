import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSafeEgressUrl } from './egress.ts';

test('assertSafeEgressUrl allows public https URLs', () => {
  const result = assertSafeEgressUrl('https://example.com/path');
  assert.equal(result.ok, true);
});

test('assertSafeEgressUrl rejects private and metadata targets', () => {
  for (const url of [
    'http://127.0.0.1/',
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost/admin',
    'http://user:pass@example.com/',
    'ftp://example.com/',
    'http://[::1]/',
    'http://[::]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:7f00:1]/',
  ]) {
    const result = assertSafeEgressUrl(url);
    assert.equal(result.ok, false, url);
  }
});
