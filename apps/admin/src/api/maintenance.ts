import { apiGet, apiPost } from './client';
import type { Backup } from '@linketry/shared';

export interface InstanceResetPreview {
  confirmationPhrase: 'RESET LINKETRY';
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
  return apiGet('/api/v1/maintenance/reset-preview');
}

export function resetInstance(payload: {
  confirmation: string;
  createBackup: boolean;
}): Promise<InstanceResetResult> {
  return apiPost('/api/v1/maintenance/reset', payload);
}
