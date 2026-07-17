import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAnalyticsRefreshInterval } from './analyticsRefresh.ts';

test('analytics refresh interval accepts only bounded supported values', () => {
  assert.equal(normalizeAnalyticsRefreshInterval('5'), 5);
  assert.equal(normalizeAnalyticsRefreshInterval(30), 30);
  assert.equal(normalizeAnalyticsRefreshInterval('1'), 10);
  assert.equal(normalizeAnalyticsRefreshInterval(null), 10);
});
