import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeHealthMonitoringLimit,
  parseHealthMonitoringEnabled,
} from './monitoringPolicy.ts';

test('scheduled health monitoring is opt-in', () => {
  assert.equal(parseHealthMonitoringEnabled(), false);
  assert.equal(parseHealthMonitoringEnabled('false'), false);
  assert.equal(parseHealthMonitoringEnabled('true'), true);
});

test('scheduled health monitoring validates the batch limit', () => {
  assert.equal(normalizeHealthMonitoringLimit(), 20);
  assert.equal(normalizeHealthMonitoringLimit('1'), 1);
  assert.equal(normalizeHealthMonitoringLimit('50'), 50);
  assert.equal(normalizeHealthMonitoringLimit('0'), 20);
  assert.equal(normalizeHealthMonitoringLimit('51'), 20);
  assert.equal(normalizeHealthMonitoringLimit('invalid'), 20);
});
