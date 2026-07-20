import assert from 'node:assert/strict';
import test from 'node:test';
import { makeUniqueSlug, parseConflictStrategy, summarizeImportPreview } from './importPolicy.ts';

test('import conflicts default to skip and require an explicit destructive strategy', () => {
  assert.equal(parseConflictStrategy(undefined), 'skip');
  assert.equal(parseConflictStrategy('invalid'), 'skip');
  assert.equal(parseConflictStrategy('rename'), 'rename');
  assert.equal(parseConflictStrategy('overwrite'), 'overwrite');
});

test('renamed conflicts stay unique and within the slug length limit', () => {
  const existing = new Set(['LaunchCase', 'LaunchCase-2', 'LaunchCase-3']);
  assert.equal(makeUniqueSlug('LaunchCase', existing), 'LaunchCase-4');

  const longSlug = 'a'.repeat(100);
  assert.equal(makeUniqueSlug(longSlug, new Set([longSlug])).length, 96);
});

test('preview separates valid, invalid, and existing-slug conflict rows', () => {
  const items = [
    { slug: 'new-link', longUrl: 'https://example.test/new' },
    { slug: 'existing', longUrl: 'https://example.test/existing' },
    { slug: 'bad/path', longUrl: 'invalid' },
  ];
  const result = summarizeImportPreview(
    items.map((item) => ({
      item,
      validation: item.slug.includes('/')
        ? { valid: false, errors: ['invalid slug'] }
        : { valid: true, errors: [] },
    })),
    new Set(['existing'])
  );

  assert.deepEqual(
    {
      total: result.total,
      valid: result.valid,
      invalid: result.invalid,
      conflicts: result.conflicts,
    },
    { total: 3, valid: 1, invalid: 1, conflicts: 1 }
  );
  assert.equal(result.preview[0]._conflict, false);
  assert.equal(result.preview[1]._conflict, true);
  assert.deepEqual(result.preview[2]._errors, ['invalid slug']);
});
