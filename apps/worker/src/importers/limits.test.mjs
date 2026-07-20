import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IMPORT_CONTENT_MAX_BYTES,
  IMPORT_ITEM_MAX_COUNT,
  formatImportContentLimit,
  formatImportItemLimit,
  importContentByteLength,
  isImportContentWithinLimit,
  isImportItemCountWithinLimit,
} from '../../../../packages/shared/src/importLimits.ts';
import {
  SHLINK_API_FETCH_MAX_ITEMS,
  SHLINK_API_FETCH_MAX_PAGES,
  isShlinkApiPageComplete,
  shlinkApiFetchLimitError,
} from './shlinkApiPolicy.ts';

test('import limits are bounded and count UTF-8 bytes', () => {
  assert.equal(IMPORT_CONTENT_MAX_BYTES, 10 * 1024 * 1024);
  assert.equal(IMPORT_ITEM_MAX_COUNT, 50_000);
  assert.equal(importContentByteLength('中文'), 6);
  assert.equal(formatImportContentLimit(), '10 MiB');
  assert.equal(formatImportItemLimit(), '50,000');
  assert.equal(isImportContentWithinLimit('a'.repeat(IMPORT_CONTENT_MAX_BYTES)), true);
  assert.equal(isImportContentWithinLimit('a'.repeat(IMPORT_CONTENT_MAX_BYTES + 1)), false);
  assert.equal(isImportItemCountWithinLimit(IMPORT_ITEM_MAX_COUNT), true);
  assert.equal(isImportItemCountWithinLimit(IMPORT_ITEM_MAX_COUNT + 1), false);
  assert.equal(isImportItemCountWithinLimit(-1), false);
});

test('Shlink API pull fails explicitly instead of truncating large pagination', () => {
  assert.equal(SHLINK_API_FETCH_MAX_ITEMS, 5_000);
  assert.equal(SHLINK_API_FETCH_MAX_PAGES, 100);
  assert.equal(shlinkApiFetchLimitError(SHLINK_API_FETCH_MAX_ITEMS), undefined);
  assert.match(shlinkApiFetchLimitError(SHLINK_API_FETCH_MAX_ITEMS + 1), /5,000-item/);
  assert.match(shlinkApiFetchLimitError(100, SHLINK_API_FETCH_MAX_ITEMS + 1), /5,000-item/);
  assert.equal(
    isShlinkApiPageComplete({
      page: 2,
      pageItemCount: 100,
      pageSize: 100,
      fetchedCount: 200,
      pagesTotal: 2,
      totalItems: 200,
    }),
    true
  );
  assert.equal(
    isShlinkApiPageComplete({
      page: 2,
      pageItemCount: 100,
      pageSize: 100,
      fetchedCount: 200,
      pagesTotal: 3,
      totalItems: 300,
    }),
    false
  );
});
