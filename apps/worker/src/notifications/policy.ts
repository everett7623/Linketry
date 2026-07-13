export const NOTIFICATION_PROVIDERS = [
  'telegram',
  'discord',
  'slack',
  'feishu',
  'dingtalk',
  'wecom',
] as const;

export type NotificationProvider = typeof NOTIFICATION_PROVIDERS[number];

export function buildNotificationRequest(
  provider: NotificationProvider,
  credential: string,
  target: string,
  message: string
): { url: string; body: Record<string, unknown> } {
  if (provider === 'telegram') {
    return {
      url: `https://api.telegram.org/bot${credential}/sendMessage`,
      body: { chat_id: target, text: message, disable_web_page_preview: true },
    };
  }
  if (provider === 'discord') {
    return { url: credential, body: { content: message, allowed_mentions: { parse: [] } } };
  }
  if (provider === 'slack') return { url: credential, body: { text: message } };
  if (provider === 'feishu') return { url: credential, body: { msg_type: 'text', content: { text: message } } };
  return { url: credential, body: { msgtype: 'text', text: { content: message } } };
}

export function formatHealthNotification(
  event: 'health_check.failed' | 'health_check.recovered',
  data: unknown
): string {
  const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const summary = record.summary && typeof record.summary === 'object'
    ? record.summary as Record<string, unknown>
    : {};
  const rawItems = Array.isArray(summary.items)
    ? summary.items.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : Array.isArray(record.items)
      ? record.items.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      : [];
  const isFailure = event === 'health_check.failed';
  const items = isFailure ? rawItems.filter((item) => item.status !== 'healthy') : rawItems;
  const lines = [
    isFailure ? '🚨 Linkora target alert' : '✅ Linkora target recovered',
    isFailure
      ? `Checked ${numberValue(summary.total)} · warning ${numberValue(summary.warning)} · broken ${numberValue(summary.broken)}`
      : `${items.length || arrayLength(record.recovered)} target(s) recovered`,
  ];

  for (const item of items.slice(0, 10)) {
    const slug = stringValue(item.slug) || stringValue(item.link_id) || 'unknown';
    const url = stringValue(item.url);
    const status = item.http_status === null || item.http_status === undefined
      ? stringValue(item.error) || stringValue(item.status)
      : `HTTP ${String(item.http_status)}`;
    lines.push(`• /${slug} — ${status}${url ? `\n  ${url}` : ''}`);
  }
  if (items.length > 10) lines.push(`…and ${items.length - 10} more`);
  return lines.join('\n').slice(0, 1900);
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}
