import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteExpiredBackups,
  normalizeBackupRetentionDays,
} from './retentionPolicy.ts';

test('backup retention defaults to 30 days and validates configured values', () => {
  assert.equal(normalizeBackupRetentionDays(), 30);
  assert.equal(normalizeBackupRetentionDays('90'), 90);
  assert.equal(normalizeBackupRetentionDays('0'), 30);
  assert.equal(normalizeBackupRetentionDays('3651'), 30);
  assert.equal(normalizeBackupRetentionDays('invalid'), 30);
});

test('backup retention deletes expired R2 objects before their D1 records', async () => {
  const events = [];
  const deleted = await deleteExpiredBackups(
    [
      {
        id: 'old-backup',
        filename: 'backups/old.json',
        storage: 'r2',
      },
    ],
    async (key) => events.push(`r2:${key}`),
    async (id) => events.push(`db:${id}`)
  );

  assert.equal(deleted, 1);
  assert.deepEqual(events, ['r2:backups/old.json', 'db:old-backup']);
});

test('backup retention preserves R2 records when the bucket binding is unavailable', async () => {
  const events = [];
  const deleted = await deleteExpiredBackups(
    [
      {
        id: 'preserved-backup',
        filename: 'backups/preserved.json',
        storage: 'r2',
      },
    ],
    undefined,
    async (id) => events.push(`db:${id}`)
  );

  assert.equal(deleted, 0);
  assert.deepEqual(events, []);
});
