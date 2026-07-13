import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { recordAudit } from '../audit/index';
import {
  getNotificationConfig,
  NOTIFICATION_PROVIDERS,
  sendTestNotification,
  updateNotificationChannel,
} from '../notifications/index';
import { jsonError, jsonOk } from '../utils/response';

const notificationRoutes = new Hono<{ Bindings: Env }>();

notificationRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

notificationRoutes.get('/config', async (c) => {
  return jsonOk({
    ...(await getNotificationConfig(c.env)),
    available_providers: NOTIFICATION_PROVIDERS,
  });
});

notificationRoutes.put('/config/:provider', async (c) => {
  let body: { enabled?: unknown; credential?: unknown; target?: unknown; clearCredential?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  try {
    const channel = await updateNotificationChannel(c.env, c.req.param('provider'), body);
    await recordAudit(c.env, c.req.raw, 'notification.update', 'notification', channel.provider, {
      provider: channel.provider,
      enabled: channel.enabled,
      configured: channel.configured,
    });
    return jsonOk(channel);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Invalid notification config', 400);
  }
});

notificationRoutes.post('/test/:provider', async (c) => {
  try {
    const result = await sendTestNotification(c.env, c.req.param('provider'));
    await recordAudit(c.env, c.req.raw, 'notification.test', 'notification', result.provider, result);
    if (!result.ok) return jsonError(result.error ?? `${result.provider} returned HTTP ${result.status}`, 502);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Notification test failed', 400);
  }
});

export default notificationRoutes;
