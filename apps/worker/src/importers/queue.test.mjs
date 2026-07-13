import assert from 'node:assert/strict';
import test from 'node:test';
import { runAfterImportQueueBoundary } from './queue.ts';

test('queued import work waits for the asynchronous processing boundary', async () => {
  let releaseBoundary;
  let parsingStarted = false;
  const boundary = new Promise((resolve) => {
    releaseBoundary = resolve;
  });

  const queued = runAfterImportQueueBoundary(
    () => boundary,
    async () => {
      parsingStarted = true;
      return 195;
    }
  );

  await Promise.resolve();
  assert.equal(parsingStarted, false);

  releaseBoundary();
  assert.equal(await queued, 195);
  assert.equal(parsingStarted, true);
});
