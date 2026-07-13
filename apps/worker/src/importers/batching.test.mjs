import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkImportItems, IMPORT_WRITE_BATCH_SIZE } from './batching.ts';

test('large imports are split into bounded D1 write batches', () => {
  const items = Array.from({ length: 195 }, (_, index) => index);
  const batches = chunkImportItems(items);

  assert.equal(IMPORT_WRITE_BATCH_SIZE, 25);
  assert.equal(batches.length, 8);
  assert.deepEqual(batches.map((batch) => batch.length), [25, 25, 25, 25, 25, 25, 25, 20]);
  assert.deepEqual(batches.flat(), items);
});

test('import batching rejects invalid sizes', () => {
  assert.throws(() => chunkImportItems([1], 0), /positive integer/);
  assert.deepEqual(chunkImportItems([], 25), []);
});
