import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  detectBitlyCsv,
  detectShortIoCsv,
  parseBitlyCsv,
  parseCsvRecords,
  parseShortIoCsv,
} from './mainstreamCore.ts';
import { validateLongUrl, validateSlug } from '../../../../packages/shared/src/validators/index.ts';

const bitlyFixture = await readFile(
  new URL('./fixtures/bitly-export.csv', import.meta.url),
  'utf8'
);
const shortIoFixture = await readFile(
  new URL('./fixtures/shortio-export.csv', import.meta.url),
  'utf8'
);

test('CSV parser preserves quoted commas, escaped quotes, and multiline fields', () => {
  const rows = parseCsvRecords('slug,title\r\nExample,"Line one, ""quoted""\r\nLine two"\r\n');
  assert.deepEqual(rows, [{ slug: 'Example', title: 'Line one, "quoted"\nLine two' }]);
});

test('Bitly CSV detection is conservative', () => {
  assert.equal(detectBitlyCsv(bitlyFixture), true);
  assert.equal(detectBitlyCsv(shortIoFixture), false);
  assert.equal(
    detectBitlyCsv('Link,Destination URL\nhttps://bit.ly/a,https://example.test'),
    false
  );
  assert.equal(detectBitlyCsv([{ Link: 'https://bit.ly/a' }]), false);
});

test('platform short URLs reject unsafe protocols and embedded credentials', () => {
  const unsafeProtocol = [
    'Link,Custom Link,Date created,Title,Destination URL,Engagements,Status',
    'javascript:alert(1),,2026-01-01T00:00:00Z,Unsafe,https://example.test,0,Active',
  ].join('\n');
  const credentialed = [
    'idString,shortURL,originalPath,originalURL,title,clicks,createdAt',
    'short_unsafe,https://user:pass@s.example.test/secret,,https://example.test,Unsafe,0,2026-01-01T00:00:00Z',
  ].join('\n');

  assert.equal(parseBitlyCsv(unsafeProtocol)[0].shortUrl, undefined);
  assert.equal(parseBitlyCsv(unsafeProtocol)[0].slug, '');
  assert.equal(parseShortIoCsv(credentialed)[0].shortUrl, undefined);
  assert.equal(parseShortIoCsv(credentialed)[0].slug, '');
});

test('Bitly CSV preserves custom domains, case-sensitive slugs, totals, and status', async () => {
  const items = parseBitlyCsv(bitlyFixture);
  assert.equal(items.length, 3);
  assert.deepEqual(items[0], {
    slug: 'LaunchCase',
    longUrl: 'https://destination.example.test/products?campaign=summer',
    domain: 'go.example.test',
    shortUrl: 'https://go.example.test/LaunchCase',
    title: 'Launch, "Summer"',
    clicks: 1234,
    createdAt: '2026-06-01T08:30:00Z',
    source: 'bitly-csv',
    sourceId: 'https://bit.ly/AbC123',
    status: 'active',
    archived: 0,
    raw: items[0].raw,
  });
  assert.equal(items[1].slug, 'OldLink');
  assert.equal(items[1].status, 'archived');
  assert.equal(items[1].archived, 1);
  assert.equal(validateSlug(items[0].slug).valid && validateLongUrl(items[0].longUrl).valid, true);
  assert.equal(validateSlug(items[2].slug).valid && validateLongUrl(items[2].longUrl).valid, false);
});

test('Short.io CSV detection is conservative', () => {
  assert.equal(detectShortIoCsv(shortIoFixture), true);
  assert.equal(detectShortIoCsv(bitlyFixture), false);
  assert.equal(
    detectShortIoCsv('idString,shortURL,originalURL\na,https://s.test/a,https://e.test'),
    false
  );
});

test('Short.io CSV preserves source identifiers, metadata, expiry, and empty fields', async () => {
  const items = parseShortIoCsv(shortIoFixture);
  assert.equal(items.length, 3);
  assert.equal(items[0].slug, 'LaunchCase');
  assert.equal(items[0].domain, 's.example.test');
  assert.equal(items[0].shortUrl, 'https://s.example.test/LaunchCase');
  assert.equal(items[0].sourceId, 'short_001');
  assert.equal(items[0].title, 'Release, "Wave 1"');
  assert.equal(items[0].clicks, 245);
  assert.deepEqual(items[0].tags, ['marketing', 'launch']);
  assert.equal(items[0].createdAt, '2026-05-01T08:00:00Z');
  assert.equal(items[0].updatedAt, '2026-05-03T09:30:00Z');
  assert.equal(items[0].expiresAt, '2027-05-01T08:00:00Z');
  assert.equal(items[1].title, undefined);
  assert.equal(items[1].expiresAt, null);
  assert.deepEqual(items[1].tags, []);
  assert.equal(validateSlug(items[0].slug).valid && validateLongUrl(items[0].longUrl).valid, true);
  assert.equal(validateSlug(items[2].slug).valid && validateLongUrl(items[2].longUrl).valid, false);
});
