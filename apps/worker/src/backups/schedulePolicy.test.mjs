import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_BACKUP_INTERVAL_DAYS,
  normalizeBackupIntervalDays,
  shouldCreateScheduledBackup,
} from './schedulePolicy.ts';

test('backup interval defaults to 3 days and validates configured values', () => {
  assert.equal(DEFAULT_BACKUP_INTERVAL_DAYS, 3);
  assert.equal(normalizeBackupIntervalDays(), 3);
  assert.equal(normalizeBackupIntervalDays('5'), 5);
  assert.equal(normalizeBackupIntervalDays('1'), 1);
  assert.equal(normalizeBackupIntervalDays('0'), 3);
  assert.equal(normalizeBackupIntervalDays('366'), 3);
  assert.equal(normalizeBackupIntervalDays('invalid'), 3);
});

test('scheduled backup runs when no completed backup exists', () => {
  const now = new Date('2026-11-12T18:00:00.000Z');
  assert.equal(shouldCreateScheduledBackup(null, now, 3), true);
  assert.equal(shouldCreateScheduledBackup(undefined, now, 3), true);
  assert.equal(shouldCreateScheduledBackup('not-a-date', now, 3), true);
});

test('scheduled backup waits for the configured interval after a completed backup', () => {
  const now = new Date('2026-11-12T18:00:00.000Z');
  assert.equal(shouldCreateScheduledBackup('2026-11-11T18:00:00.000Z', now, 3), false);
  assert.equal(shouldCreateScheduledBackup('2026-11-09T18:00:00.000Z', now, 3), true);
  assert.equal(shouldCreateScheduledBackup('2026-11-09T17:59:59.000Z', now, 3), true);
  assert.equal(shouldCreateScheduledBackup('2026-11-07T18:00:00.000Z', now, 5), true);
  assert.equal(shouldCreateScheduledBackup('2026-11-08T18:00:00.000Z', now, 5), false);
});
