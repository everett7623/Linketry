import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDestinationUrl } from './duplicateDestination.ts';

test('normalizes host casing, default ports, and query parameter order', () => {
  assert.deepEqual(
    normalizeDestinationUrl(' HTTPS://Example.COM:443/path?z=2&a=1 '),
    { normalizedUrl: 'https://example.com/path?a=1&z=2', originPrefix: 'https://example.com' }
  );
});

test('preserves meaningful paths, fragments, protocols, and duplicate query values', () => {
  assert.equal(
    normalizeDestinationUrl('http://example.com/path?a=2&a=1#section')?.normalizedUrl,
    'http://example.com/path?a=2&a=1#section'
  );
});

test('rejects malformed and non-http destinations and strips credentials from comparison', () => {
  assert.equal(normalizeDestinationUrl('not a url'), null);
  assert.equal(normalizeDestinationUrl('javascript:alert(1)'), null);
  assert.equal(normalizeDestinationUrl('https://user:secret@example.com')?.normalizedUrl, 'https://example.com/');
});
