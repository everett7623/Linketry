import { Hono } from 'hono';
import { parseStoredQrStyle, validateQrStyle } from '@linketry/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { recordAudit } from '../audit/index';
import { getSetting, setSetting } from '../db/index';
import { now } from '../utils/id';
import { jsonError, jsonOk } from '../utils/response';

export const QR_STYLE_SETTING_KEY = 'qr_style_default';

const qrStyle = new Hono<{ Bindings: Env }>();

qrStyle.get('/', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  return jsonOk(parseStoredQrStyle(await getSetting(c.env, QR_STYLE_SETTING_KEY)));
});

qrStyle.put('/', async (c) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const result = validateQrStyle(body);
  if (!result.valid) return jsonError(result.error, 400);

  await setSetting(c.env, QR_STYLE_SETTING_KEY, JSON.stringify(result.style), now());
  await recordAudit(c.env, c.req.raw, 'qr_style.update', 'settings', QR_STYLE_SETTING_KEY, {
    foreground: result.style.foreground,
    background: result.style.background,
    logo: result.style.logo !== null,
    caption: result.style.caption,
    size: result.style.size,
    format: result.style.format,
  });
  return jsonOk(result.style);
});

export default qrStyle;
