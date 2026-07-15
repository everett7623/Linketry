export const LINKETRY_BACKUP_NAME = 'Linketry Backup';
export const LEGACY_LINKORA_BACKUP_NAME = 'Linkora Backup';

export function isSupportedBackupPayload(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as { name?: unknown; links?: unknown };
  return (
    (payload.name === LINKETRY_BACKUP_NAME || payload.name === LEGACY_LINKORA_BACKUP_NAME) &&
    Array.isArray(payload.links)
  );
}
