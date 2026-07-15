import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyBulkUtmPolicy,
  bulkUtmCsv,
  MAX_BULK_UTM_LINKS,
  parseBulkUtmPolicy,
} from './bulkUtm.ts';
import { updateBulkUtmLinks } from '../db/bulkUtm.ts';
import { bulkUtmCacheTargets } from './bulkUtmCache.ts';

function policy(mode, parameters, values = {}) {
  const parsed = parseBulkUtmPolicy(mode, parameters, values);
  assert.equal(parsed.error, undefined);
  return parsed.policy;
}

test('add-missing preserves unrelated raw encoding and fragment bytes', () => {
  const result = applyBulkUtmPolicy(
    'https://example.com/p?a=hello%20world&x=%2f#frag?kept',
    policy('add_missing', ['utm_source'], { utm_source: 'summer news' })
  );
  assert.equal(result.status, 'ready');
  assert.equal(
    result.nextUrl,
    'https://example.com/p?a=hello%20world&x=%2f&utm_source=summer%20news#frag?kept'
  );
});

test('add-missing leaves an existing selected parameter untouched', () => {
  const result = applyBulkUtmPolicy(
    'https://example.com/?utm_source=manual+value&a=1',
    policy('add_missing', ['utm_source'], { utm_source: 'replacement' })
  );
  assert.equal(result.status, 'unchanged');
  assert.equal(result.nextUrl, 'https://example.com/?utm_source=manual+value&a=1');
});

test('replace-selected normalizes duplicate encoded keys without changing other parameters', () => {
  const result = applyBulkUtmPolicy(
    'https://example.com/?utm_source=old&a=1&utm%5Fsource=duplicate#section',
    policy('replace_selected', ['utm_source'], { utm_source: 'new' })
  );
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.conflicts, ['utm_source']);
  assert.equal(result.nextUrl, 'https://example.com/?utm_source=new&a=1#section');
});

test('remove-selected removes every selected occurrence and preserves the rest', () => {
  const result = applyBulkUtmPolicy(
    'https://example.com/p?x=1&utm_campaign=a&utm_campaign=b&raw=%2B#end',
    policy('remove_selected', ['utm_campaign'])
  );
  assert.equal(result.status, 'ready');
  assert.equal(result.nextUrl, 'https://example.com/p?x=1&raw=%2B#end');
});

test('remove-selected does not rewrite a URL when the selected key is absent', () => {
  const selected = policy('remove_selected', ['utm_source']);
  assert.deepEqual(applyBulkUtmPolicy('https://example.com/path?', selected), {
    status: 'unchanged',
    nextUrl: 'https://example.com/path?',
    conflicts: [],
  });
});

test('credentialed and malformed query URLs are rejected without output changes', () => {
  const selected = policy('remove_selected', ['utm_source']);
  const credentialed = applyBulkUtmPolicy('https://user:secret@example.com/?utm_source=x', selected);
  const malformed = applyBulkUtmPolicy('https://example.com/?%ZZ=bad&utm_source=x', selected);
  assert.equal(credentialed.status, 'invalid');
  assert.match(credentialed.error, /Credentialed/);
  assert.equal(malformed.status, 'invalid');
  assert.match(malformed.error, /malformed/);
});

test('policy validation rejects unknown, duplicate, and empty parameters', () => {
  assert.match(parseBulkUtmPolicy('unknown', ['utm_source'], {}).error, /mode/);
  assert.match(parseBulkUtmPolicy('remove_selected', ['utm_source', 'utm_source'], {}).error, /duplicate/);
  assert.match(parseBulkUtmPolicy('replace_selected', ['utm_source'], {}).error, /must not be empty/);
});

test('change CSV contains all required fields and escapes values', () => {
  const csv = bulkUtmCsv([
    { id: 'id-1', slug: 'docs', oldUrl: 'https://example.com/?q="old"', newUrl: 'https://example.com/?q="new"' },
  ], policy('replace_selected', ['utm_source'], { utm_source: 'newsletter' }), '2026-07-15T00:00:00.000Z');
  assert.match(csv, /^id,slug,old_url,new_url,mode,parameters,changed_at\r\n/);
  assert.match(csv, /""old""/);
  assert.match(csv, /"replace_selected","utm_source","2026-07-15T00:00:00.000Z"/);
});

test('D1 updates use optimistic URL matching and report only changed rows', async () => {
  const prepared = [];
  const env = {
    DB: {
      prepare(sql) {
        return { bind(...params) { const statement = { sql, params }; prepared.push(statement); return statement; } };
      },
      async batch() {
        return [{ meta: { changes: 1 } }, { meta: { changes: 0 } }];
      },
    },
  };
  const updates = [
    { id: 'one', currentUrl: 'https://old/1', nextUrl: 'https://new/1' },
    { id: 'two', currentUrl: 'https://old/2', nextUrl: 'https://new/2' },
  ];
  const changed = await updateBulkUtmLinks(env, updates, '2026-07-15T00:00:00.000Z');
  assert.deepEqual(changed, [updates[0]]);
  assert.match(prepared[0].sql, /WHERE id = \? AND long_url = \?/);
  assert.deepEqual(prepared[0].params, ['https://new/1', '2026-07-15T00:00:00.000Z', 'one', 'https://old/1']);
});

test('the maximum safe scope is written as one bounded D1 batch', async () => {
  let statementCount = 0;
  const env = {
    DB: {
      prepare(sql) {
        return { bind(...params) { return { sql, params }; } };
      },
      async batch(statements) {
        statementCount = statements.length;
        return statements.map(() => ({ meta: { changes: 1 } }));
      },
    },
  };
  const updates = Array.from({ length: MAX_BULK_UTM_LINKS }, (_, index) => ({
    id: `id-${index}`,
    currentUrl: `https://example.com/${index}`,
    nextUrl: `https://example.com/${index}?utm_source=test`,
  }));
  const changed = await updateBulkUtmLinks(env, updates, '2026-07-15T00:00:00.000Z');
  assert.equal(statementCount, MAX_BULK_UTM_LINKS);
  assert.equal(changed.length, MAX_BULK_UTM_LINKS);
});

test('cache clearing targets only successfully changed links', () => {
  const targets = bulkUtmCacheTargets([
    { slug: 'one', domain: 's.example.com' },
    { slug: 'two', domain: null },
  ], 'go.example.com');
  assert.deepEqual(targets, [
    { domain: 's.example.com', slug: 'one' },
    { domain: 'go.example.com', slug: 'two' },
  ]);
});
