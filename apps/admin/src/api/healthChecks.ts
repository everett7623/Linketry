import type { LinkHealthBatchResult, LinkHealthCheckResult } from '@linketry/shared';
import { apiGet, apiPost, API_LONG_TIMEOUT_MS } from './client';

export interface HealthAlertStatus {
  items: Array<{
    link_id: string;
    slug: string | null;
    domain: string | null;
    fallback_url: string | null;
    consecutive_failures: number;
    alerted: boolean;
  }>;
  last_alert_at: string | null;
}

export function getHealthAlertStatus(): Promise<HealthAlertStatus> {
  return apiGet('/api/v1/health-checks/alerts', {}, API_LONG_TIMEOUT_MS);
}

export interface HealthCheckHistory {
  items: Array<{
    link_id: string;
    slug: string | null;
    domain: string | null;
    status: 'healthy' | 'warning' | 'broken';
    http_status: number | null;
    checked_at: string;
    response_time_ms: number;
    consecutive_failures: number;
  }>;
}

export function getHealthCheckHistory(): Promise<HealthCheckHistory> {
  return apiGet('/api/v1/health-checks/history', {}, API_LONG_TIMEOUT_MS);
}

export function checkUrl(url: string): Promise<LinkHealthCheckResult> {
  return apiPost('/api/v1/health-checks/url', { url }, API_LONG_TIMEOUT_MS);
}

export function checkLink(id: string): Promise<LinkHealthCheckResult> {
  return apiPost(`/api/v1/health-checks/links/${id}`, undefined, API_LONG_TIMEOUT_MS);
}

export function runHealthCheckBatch(
  payload: { ids?: string[]; limit?: number } = {}
): Promise<LinkHealthBatchResult> {
  return apiPost('/api/v1/health-checks/batch', payload, API_LONG_TIMEOUT_MS);
}
