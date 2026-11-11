export const DEFAULT_BACKUP_INTERVAL_DAYS = 3;

export function normalizeBackupIntervalDays(value?: string): number {
  const configuredDays = Number.parseInt(value ?? String(DEFAULT_BACKUP_INTERVAL_DAYS), 10);
  return Number.isFinite(configuredDays) && configuredDays >= 1 && configuredDays <= 365
    ? configuredDays
    : DEFAULT_BACKUP_INTERVAL_DAYS;
}

/**
 * Scheduled backups still ride the daily Cron, but only run when enough time has
 * passed since the last *completed* snapshot. Failed rows do not postpone the next try.
 */
export function shouldCreateScheduledBackup(
  lastCompletedAt: string | null | undefined,
  now: Date,
  intervalDays = DEFAULT_BACKUP_INTERVAL_DAYS
): boolean {
  if (!lastCompletedAt) return true;
  const lastMs = Date.parse(lastCompletedAt);
  if (!Number.isFinite(lastMs)) return true;
  return now.getTime() - lastMs >= intervalDays * 24 * 60 * 60 * 1000;
}
