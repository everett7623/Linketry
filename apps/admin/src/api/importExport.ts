import { apiPost, apiGet, downloadFile } from './client';
import type { ImportFieldMapping, ImportJob } from '@linketry/shared';

export interface PreviewResult {
  source: string;
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  preview: Array<{
    slug: string;
    longUrl: string;
    title?: string;
    _valid: boolean;
    _errors: string[];
    _conflict: boolean;
  }>;
}

export function previewImport(
  content: string,
  source?: string,
  fieldMapping?: ImportFieldMapping
): Promise<PreviewResult> {
  return apiPost('/api/v1/import/preview', { content, source, fieldMapping });
}

export interface ConfirmResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  success?: number;
  skipped?: number;
  conflicts?: number;
  failed?: number;
  conflictStrategy?: ImportConflictStrategy;
  completedAt?: string;
}

export type ImportConflictStrategy = 'skip' | 'rename' | 'overwrite';
const IMPORT_CONFIRM_TIMEOUT_MS = 60_000;

export function confirmImport(
  content: string,
  source?: string,
  filename?: string,
  conflictStrategy: ImportConflictStrategy = 'skip',
  fieldMapping?: ImportFieldMapping
): Promise<ConfirmResult> {
  return apiPost(
    '/api/v1/import/confirm',
    { content, source, filename, conflictStrategy, fieldMapping },
    IMPORT_CONFIRM_TIMEOUT_MS
  );
}

export function fetchShlinkApi(baseUrl: string, apiKey: string): Promise<{
  source: 'shlink';
  total: number;
  content: string;
  filename: string;
}> {
  return apiPost('/api/v1/import/shlink-api/fetch', { baseUrl, apiKey });
}

export function listImportJobs(): Promise<ImportJob[]> {
  return apiGet('/api/v1/import/jobs', { cache: 'no-store' });
}

export function getImportJob(id: string): Promise<ImportJob> {
  return apiGet(`/api/v1/import/jobs/${id}`, { cache: 'no-store' });
}

export function downloadImportReport(id: string, date: string): Promise<void> {
  return downloadFile(`/api/v1/import/jobs/${id}/report.csv`, `import-report-${date}.csv`);
}

function timestampForFilename(): string {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 19).replace(/:/g, '')}`;
}

export function exportLinksCSV(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/v1/export/links.csv', `linketry-links-${today}.csv`);
}

export function exportLinksJSON(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/v1/export/links.json', `linketry-links-${today}.json`);
}

export function exportVisitsCSV(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/v1/export/visits.csv', `linketry-visits-${today}.csv`);
}

export function exportBackup(filename = `linketry-backup-${timestampForFilename()}.json`): Promise<void> {
  return downloadFile('/api/v1/export/backup.json', filename);
}

export function exportPreImportBackup(): Promise<void> {
  return exportBackup(`linketry-pre-import-backup-${timestampForFilename()}.json`);
}
