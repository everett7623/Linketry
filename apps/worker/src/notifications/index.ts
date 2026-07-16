import type { Env } from '../types';
import { getSettings, setSetting } from '../db/index';
import { now } from '../utils/id';
import {
  buildNotificationRequest,
  formatHealthNotification,
  formatTrafficAnomalyNotification,
  NOTIFICATION_PROVIDERS,
  type NotificationProvider,
} from './policy';

export { NOTIFICATION_PROVIDERS } from './policy';
export type { NotificationProvider } from './policy';

interface StoredNotificationChannel {
  enabled: boolean;
  credential: string;
  target: string;
}

type StoredNotificationConfig = Partial<Record<NotificationProvider, StoredNotificationChannel>>;

export interface NotificationChannelConfig {
  provider: NotificationProvider;
  enabled: boolean;
  configured: boolean;
  target: string;
}

export interface NotificationDeliveryResult {
  provider: NotificationProvider;
  ok: boolean;
  status?: number;
  error?: string;
}

const PROVIDER_SET = new Set<string>(NOTIFICATION_PROVIDERS);
const SETTINGS_KEY = 'notification_channels';
const DELIVERY_TIMEOUT_MS = 5000;

const WEBHOOK_RULES: Record<Exclude<NotificationProvider, 'telegram'>, { hosts: string[]; path: RegExp }> = {
  discord: { hosts: ['discord.com', 'discordapp.com'], path: /^\/api\/webhooks\// },
  slack: { hosts: ['hooks.slack.com'], path: /^\/services\// },
  feishu: { hosts: ['open.feishu.cn'], path: /^\/open-apis\/bot\/v2\/hook\// },
  dingtalk: { hosts: ['oapi.dingtalk.com'], path: /^\/robot\/send/ },
  wecom: { hosts: ['qyapi.weixin.qq.com'], path: /^\/cgi-bin\/webhook\/send/ },
};

export async function getNotificationConfig(env: Env): Promise<{ channels: NotificationChannelConfig[] }> {
  const stored = await getStoredConfig(env);
  return {
    channels: NOTIFICATION_PROVIDERS.map((provider) => publicChannel(provider, stored[provider])),
  };
}

export async function updateNotificationChannel(
  env: Env,
  providerValue: unknown,
  input: { enabled?: unknown; credential?: unknown; target?: unknown; clearCredential?: unknown },
  updatedAt = now()
): Promise<NotificationChannelConfig> {
  const provider = parseProvider(providerValue);
  const stored = await getStoredConfig(env);
  const existing = stored[provider] ?? emptyChannel();
  const credential = input.clearCredential === true
    ? ''
    : input.credential === undefined || input.credential === ''
      ? existing.credential
      : normalizeCredential(provider, input.credential);
  const target = input.target === undefined ? existing.target : normalizeTarget(provider, input.target);
  const enabled = input.enabled === undefined ? existing.enabled : parseBoolean(input.enabled);

  if (enabled && !credential) throw new Error(`${provider} credentials are required when enabled`);
  if (enabled && provider === 'telegram' && !target) throw new Error('Telegram chat ID is required when enabled');

  stored[provider] = { enabled, credential, target };
  await setSetting(env, SETTINGS_KEY, JSON.stringify(stored), updatedAt);
  return publicChannel(provider, stored[provider]);
}

export async function sendTestNotification(
  env: Env,
  providerValue: unknown
): Promise<NotificationDeliveryResult> {
  const provider = parseProvider(providerValue);
  const stored = await getStoredConfig(env);
  const channel = stored[provider];
  if (!channel?.credential) return { provider, ok: false, error: `${provider} is not configured` };
  return deliver(provider, channel, '✅ Linketry notification test succeeded.');
}

export async function emitHealthNotifications(
  env: Env,
  event: 'health_check.failed' | 'health_check.recovered',
  data: unknown
): Promise<void> {
  try {
    const stored = await getStoredConfig(env);
    const message = formatHealthNotification(event, data);
    const deliveries = NOTIFICATION_PROVIDERS.flatMap((provider) => {
      const channel = stored[provider];
      return channel?.enabled && channel.credential ? [deliver(provider, channel, message)] : [];
    });
    const results = await Promise.all(deliveries);
    for (const result of results) {
      if (!result.ok) {
        console.warn(JSON.stringify({
          message: 'Linketry notification delivery failed',
          provider: result.provider,
          status: result.status,
          error: result.error,
        }));
      }
    }
  } catch (error) {
    console.warn(JSON.stringify({
      message: 'Linketry notification delivery failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

export async function emitTrafficAnomalyNotifications(
  env: Env,
  event: 'traffic_anomaly.detected' | 'traffic_anomaly.recovered',
  data: unknown
): Promise<void> {
  try {
    await deliverConfiguredNotifications(env, formatTrafficAnomalyNotification(event, data));
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: 'Linketry traffic anomaly notification delivery failed',
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

async function deliverConfiguredNotifications(env: Env, message: string): Promise<void> {
  const stored = await getStoredConfig(env);
  const deliveries = NOTIFICATION_PROVIDERS.flatMap((provider) => {
    const channel = stored[provider];
    return channel?.enabled && channel.credential ? [deliver(provider, channel, message)] : [];
  });
  const results = await Promise.all(deliveries);
  for (const result of results) {
    if (!result.ok) {
      console.warn(
        JSON.stringify({
          message: 'Linketry notification delivery failed',
          provider: result.provider,
          status: result.status,
          error: result.error,
        })
      );
    }
  }
}

async function deliver(
  provider: NotificationProvider,
  channel: StoredNotificationChannel,
  message: string
): Promise<NotificationDeliveryResult> {
  const request = buildNotificationRequest(provider, channel.credential, channel.target, message);
  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Linketry-Notifications/1.0' },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    return { provider, ok: response.ok, status: response.status };
  } catch (error) {
    return { provider, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function getStoredConfig(env: Env): Promise<StoredNotificationConfig> {
  const settings = await getSettings(env);
  return parseStoredConfig(settings[SETTINGS_KEY]);
}

function parseStoredConfig(value?: string | null): StoredNotificationConfig {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const config: StoredNotificationConfig = {};
    for (const provider of NOTIFICATION_PROVIDERS) {
      const candidate = parsed[provider];
      if (!candidate || typeof candidate !== 'object') continue;
      const channel = candidate as Record<string, unknown>;
      config[provider] = {
        enabled: channel.enabled === true,
        credential: typeof channel.credential === 'string' ? channel.credential : '',
        target: typeof channel.target === 'string' ? channel.target : '',
      };
    }
    return config;
  } catch {
    return {};
  }
}

function publicChannel(
  provider: NotificationProvider,
  channel?: StoredNotificationChannel
): NotificationChannelConfig {
  return {
    provider,
    enabled: channel?.enabled ?? false,
    configured: !!channel?.credential,
    target: provider === 'telegram' ? channel?.target ?? '' : '',
  };
}

function parseProvider(value: unknown): NotificationProvider {
  if (typeof value !== 'string' || !PROVIDER_SET.has(value)) throw new Error('Unsupported notification provider');
  return value as NotificationProvider;
}

function normalizeCredential(provider: NotificationProvider, value: unknown): string {
  if (typeof value !== 'string') throw new Error(`${provider} credentials must be a string`);
  const credential = value.trim();
  if (!credential || credential.length > 2048) throw new Error(`${provider} credentials are invalid`);
  if (provider === 'telegram') {
    if (!/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(credential)) throw new Error('Telegram bot token is invalid');
    return credential;
  }

  let url: URL;
  try {
    url = new URL(credential);
  } catch {
    throw new Error(`${provider} webhook URL is invalid`);
  }
  const rule = WEBHOOK_RULES[provider];
  if (url.protocol !== 'https:' || !rule.hosts.includes(url.hostname.toLowerCase()) || !rule.path.test(url.pathname)) {
    throw new Error(`${provider} webhook URL does not match the official HTTPS endpoint`);
  }
  return url.toString();
}

function normalizeTarget(provider: NotificationProvider, value: unknown): string {
  if (provider !== 'telegram') return '';
  if (typeof value !== 'string') throw new Error('Telegram chat ID must be a string');
  const target = value.trim();
  if (target.length > 100 || (target && !/^(-?\d+|@[A-Za-z0-9_]{5,})$/.test(target))) {
    throw new Error('Telegram chat ID is invalid');
  }
  return target;
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function emptyChannel(): StoredNotificationChannel {
  return { enabled: false, credential: '', target: '' };
}
