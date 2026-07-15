import { apiGet, apiPost, apiPut } from './client';

export type NotificationProvider = 'telegram' | 'discord' | 'slack' | 'feishu' | 'dingtalk' | 'wecom';

export interface NotificationChannelConfig {
  provider: NotificationProvider;
  enabled: boolean;
  configured: boolean;
  target: string;
}

export interface NotificationConfig {
  channels: NotificationChannelConfig[];
  available_providers: NotificationProvider[];
}

export function getNotificationConfig(): Promise<NotificationConfig> {
  return apiGet('/api/v1/notifications/config', { cache: 'no-store' });
}

export function updateNotificationChannel(
  provider: NotificationProvider,
  payload: { enabled: boolean; credential?: string; target?: string; clearCredential?: boolean }
): Promise<NotificationChannelConfig> {
  return apiPut(`/api/v1/notifications/config/${provider}`, payload);
}

export function testNotificationChannel(provider: NotificationProvider): Promise<{ ok: boolean; status?: number }> {
  return apiPost(`/api/v1/notifications/test/${provider}`);
}
