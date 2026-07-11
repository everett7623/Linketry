import type { LinkHealthBatchResult, LinkHealthCheckResult } from '@linkora/shared';
import { apiGet, apiPost } from './client';

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
  return apiGet('/api/health-checks/alerts');
}

export function checkUrl(url: string): Promise<LinkHealthCheckResult> {
  return apiPost('/api/health-checks/url', { url });
}

export function checkLink(id: string): Promise<LinkHealthCheckResult> {
  return apiPost(`/api/health-checks/links/${id}`);
}

export function runHealthCheckBatch(payload: { ids?: string[]; limit?: number } = {}): Promise<LinkHealthBatchResult> {
  return apiPost('/api/health-checks/batch', payload);
}
