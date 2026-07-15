import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { recordAudit } from '../audit/index';
import {
  RESET_CONFIRMATION,
  isResetConfirmation,
  previewInstanceReset,
  resetInstance,
} from '../maintenance/reset';
import { jsonError, jsonOk } from '../utils/response';

const maintenanceRoutes = new Hono<{ Bindings: Env }>();

maintenanceRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

maintenanceRoutes.get('/reset-preview', async (c) => {
  const preview = await previewInstanceReset(c.env);
  return jsonOk(preview);
});

maintenanceRoutes.post('/reset', async (c) => {
  let body: { confirmation?: unknown; createBackup?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!isResetConfirmation(body.confirmation)) {
    return jsonError(`Type "${RESET_CONFIRMATION}" to confirm reset`, 400);
  }

  const createBackup = body.createBackup !== false;
  if (createBackup && !c.env.BACKUPS) {
    return jsonError(
      'R2 backup bucket is not configured. Disable pre-reset backup to continue.',
      503
    );
  }

  try {
    const result = await resetInstance(c.env, createBackup);
    await recordAudit(c.env, c.req.raw, 'maintenance.reset', 'instance', undefined, {
      totalRows: result.totalRows,
      kvDeleted: result.kvDeleted,
      preResetBackupId: result.preResetBackup?.id ?? null,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Instance reset failed', 500);
  }
});

export default maintenanceRoutes;
