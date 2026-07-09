import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getSettings, setSetting } from '../db/index';
import { jsonOk, jsonError } from '../utils/response';
import { now } from '../utils/id';

const settings = new Hono<{ Bindings: Env }>();

settings.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

settings.get('/', async (c) => {
  const allSettings = await getSettings(c.env);
  if ('webhook_secret' in allSettings) {
    allSettings.webhook_secret = '';
  }
  return jsonOk(allSettings);
});

settings.put('/', async (c) => {
  let body: Record<string, string>;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const ts = now();
  const updates: Promise<void>[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const normalized = normalizeSetting(key, value);
      if (normalized.error) return jsonError(normalized.error, 400);
      updates.push(setSetting(c.env, key, normalized.value, ts));
    }
  }
  await Promise.all(updates);

  return jsonOk({ message: 'Settings updated' });
});

function normalizeSetting(key: string, value: string): { value: string; error?: string } {
  if (key !== 'analytics_retention_days') return { value };
  const days = parseInt(value, 10);
  if (!Number.isFinite(days) || days < 0 || days > 3650) {
    return { value: '0', error: 'analytics_retention_days must be between 0 and 3650' };
  }
  return { value: String(days) };
}

export default settings;
