import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { recordAudit } from '../audit/index';
import { getWebhookConfig, sendTestWebhook, updateWebhookConfig, WEBHOOK_EVENTS } from '../webhooks/index';
import { jsonError, jsonOk } from '../utils/response';

const webhookRoutes = new Hono<{ Bindings: Env }>();

webhookRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

webhookRoutes.get('/config', async (c) => {
  return jsonOk({
    ...(await getWebhookConfig(c.env)),
    available_events: WEBHOOK_EVENTS,
  });
});

webhookRoutes.put('/config', async (c) => {
  let body: { enabled?: unknown; url?: unknown; events?: unknown; secret?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  try {
    const config = await updateWebhookConfig(c.env, body);
    await recordAudit(c.env, c.req.raw, 'webhook.update', 'webhook', undefined, {
      enabled: config.enabled,
      url: config.url,
      events: config.events,
      has_secret: config.has_secret,
    });
    return jsonOk({
      ...config,
      available_events: WEBHOOK_EVENTS,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Invalid webhook config', 400);
  }
});

webhookRoutes.post('/test', async (c) => {
  const result = await sendTestWebhook(c.env);
  await recordAudit(c.env, c.req.raw, 'webhook.test', 'webhook', undefined, {
    ok: result.ok,
    status: result.status,
    error: result.error,
  });

  if (!result.ok) {
    return jsonError(result.error ?? `Webhook returned HTTP ${result.status}`, 502);
  }

  return jsonOk({ message: 'Webhook delivered', status: result.status });
});

export default webhookRoutes;
