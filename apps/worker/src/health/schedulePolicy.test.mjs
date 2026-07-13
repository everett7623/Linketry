import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DAILY_CRON, DEFAULT_HEALTH_CRON, scheduledWorkForCron } from './schedulePolicy.ts';

test('hourly health work is separate from daily maintenance', () => {
  assert.deepEqual(scheduledWorkForCron(DEFAULT_HEALTH_CRON, DEFAULT_DAILY_CRON, DEFAULT_HEALTH_CRON), {
    daily: false,
    health: true,
  });
  assert.deepEqual(scheduledWorkForCron(DEFAULT_DAILY_CRON, DEFAULT_DAILY_CRON, DEFAULT_HEALTH_CRON), {
    daily: true,
    health: false,
  });
});

test('legacy single-cron deployments still run both jobs', () => {
  assert.deepEqual(scheduledWorkForCron(DEFAULT_DAILY_CRON), { daily: true, health: true });
});
