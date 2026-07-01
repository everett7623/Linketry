import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../auth/index';
import { getSettings, setSetting } from '../db/index';
import { jsonOk, jsonError, parseJsonBody } from '../utils/response';
import { now } from '../utils/id';

const settings = new Hono<{ Bindings: Env }>();

settings.use('*', authMiddleware);

settings.get('/', async (c) => {
  const allSettings = await getSettings(c.env);
  return jsonOk(allSettings);
});

settings.put('/', async (c) => {
  const body = await parseJsonBody<Record<string, string>>(c);
  if (body instanceof Response) return body;

  const ts = now();
  const updates: Promise<void>[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      updates.push(setSetting(c.env, key, value, ts));
    }
  }
  await Promise.all(updates);

  return jsonOk({ message: 'Settings updated' });
});

export default settings;
