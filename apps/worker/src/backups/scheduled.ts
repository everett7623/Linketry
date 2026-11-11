import type { Backup } from '@linketry/shared';
import type { Env } from '../types';
import { getLatestCompletedBackup, getSettings } from '../db/index';
import { createR2Backup } from './index';
import { normalizeBackupIntervalDays, shouldCreateScheduledBackup } from './schedulePolicy';

/**
 * Runs on the daily Cron when R2 is bound. Skips quietly when a completed backup
 * is still inside the configured interval so other daily jobs keep their cadence.
 */
export async function runScheduledBackup(env: Env): Promise<Backup | null> {
  const settings = await getSettings(env);
  const intervalDays = normalizeBackupIntervalDays(settings.backup_interval_days);
  const latest = await getLatestCompletedBackup(env);
  if (!shouldCreateScheduledBackup(latest?.created_at, new Date(), intervalDays)) {
    return null;
  }
  return createR2Backup(env, 'scheduled');
}
