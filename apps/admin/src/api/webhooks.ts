import { apiGet, apiPost, apiPut } from './client';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  events: string[];
  has_secret: boolean;
  available_events: string[];
}

export interface UpdateWebhookConfigPayload {
  enabled: boolean;
  url: string;
  events: string[];
  secret?: string;
}

export function getWebhookConfig(): Promise<WebhookConfig> {
  return apiGet('/api/webhooks/config');
}

export function updateWebhookConfig(payload: UpdateWebhookConfigPayload): Promise<WebhookConfig> {
  return apiPut('/api/webhooks/config', payload);
}

export function testWebhook(): Promise<{ message: string; status?: number }> {
  return apiPost('/api/webhooks/test');
}
