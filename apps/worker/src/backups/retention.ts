import type { Env } from '../types';
import { deleteBackupRecord, getSettings, listBackupsBefore } from '../db/index';
import { deleteExpiredBackups, normalizeBackupRetentionDays } from './retentionPolicy';

export { DEFAULT_BACKUP_RETENTION_DAYS } from './retentionPolicy';

export async function cleanupBackupRetention(env: Env): Promise<{
  retentionDays: number;
  cutoff: string;
  deleted: number;
}> {
  const settings = await getSettings(env);
  const retentionDays = normalizeBackupRetentionDays(settings.backup_retention_days);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const expired = await listBackupsBefore(env, cutoff);
  const deleted = await deleteExpiredBackups(
    expired,
    env.BACKUPS ? (key) => env.BACKUPS!.delete(key) : undefined,
    (id) => deleteBackupRecord(env, id)
  );

  return { retentionDays, cutoff, deleted };
}
