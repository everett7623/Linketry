import assert from 'node:assert/strict';
import test from 'node:test';
import { domainMigrationSample, migratedShortUrl } from './domainMigration.ts';

test('builds the migrated short URL without changing the slug', () => {
  assert.equal(migratedShortUrl('go.uukk.de', 'offer-1'), 'https://go.uukk.de/offer-1');
});

test('builds a preview from stored link data', () => {
  const [item] = domainMigrationSample([
    {
      id: 'link-1',
      slug: 'deal',
      domain: 's.y8o.de',
      short_url: 'https://s.y8o.de/deal',
    },
  ], 'go.uukk.de');

  assert.deepEqual(item, {
    id: 'link-1',
    slug: 'deal',
    current_short_url: 'https://s.y8o.de/deal',
    next_short_url: 'https://go.uukk.de/deal',
  });
});
