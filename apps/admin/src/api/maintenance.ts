import { apiGet, apiPost } from './client';
import type { Backup } from '@linkora/shared';

export interface InstanceResetPreview {
  confirmationPhrase: 'RESET LINKORA';
  tables: Record<string, number>;
  totalRows: number;
  kvPrefix: string;
  preservesBackups: boolean;
  preservesAdminToken: boolean;
}

export interface InstanceResetResult extends InstanceResetPreview {
  mode: 'reset';
  resetAt: string;
  kvDeleted: number;
  preResetBackup?: Backup;
}

export function getResetPreview(): Promise<InstanceResetPreview> {
  return apiGet('/api/maintenance/reset-preview');
}

export function resetInstance(payload: {
  confirmation: string;
  createBackup: boolean;
}): Promise<InstanceResetResult> {
  return apiPost('/api/maintenance/reset', payload);
}
