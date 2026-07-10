export const DEFAULT_BACKUP_RETENTION_DAYS = 30;

export interface RetainedBackup {
  id: string;
  filename: string;
  storage: string;
}

export function normalizeBackupRetentionDays(value?: string): number {
  const configuredDays = Number.parseInt(value ?? String(DEFAULT_BACKUP_RETENTION_DAYS), 10);
  return Number.isFinite(configuredDays) && configuredDays >= 1 && configuredDays <= 3650
    ? configuredDays
    : DEFAULT_BACKUP_RETENTION_DAYS;
}

export async function deleteExpiredBackups(
  backups: RetainedBackup[],
  deleteR2Object: ((key: string) => Promise<void>) | undefined,
  deleteRecord: (id: string) => Promise<void>
): Promise<number> {
  let deleted = 0;
  for (const backup of backups) {
    if (backup.storage === 'r2') {
      if (!deleteR2Object) continue;
      await deleteR2Object(backup.filename);
    }
    await deleteRecord(backup.id);
    deleted += 1;
  }
  return deleted;
}
