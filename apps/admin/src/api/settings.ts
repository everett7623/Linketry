import { apiGet, apiPut } from './client';

export function getSettings(): Promise<Record<string, string>> {
  return apiGet('/api/v1/settings');
}

export function updateSettings(payload: Record<string, string>): Promise<{ message: string }> {
  return apiPut('/api/v1/settings', payload);
}
