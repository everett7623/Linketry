import { Hono } from 'hono';
import type { DeploymentCapabilities } from '@linketry/shared';
import type { Env } from '../types';
import { isAdminToken, requireAuth } from '../auth/index';
import { recordAudit } from '../audit/index';
import { listDomains } from '../db/index';
import {
  dispatchOnlineUpgrade,
  getOnlineUpgradeCapability,
  OnlineUpgradeError,
  readOnlineUpgradeRun,
} from '../updates/github';
import { jsonError, jsonOk } from '../utils/response';

const systemRoutes = new Hono<{ Bindings: Env }>();

systemRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'read');
  if (authError) return authError;
  await next();
});

systemRoutes.get('/capabilities', async (c) => {
  const domains = await listDomains(c.env);
  const r2Backups = Boolean(c.env.BACKUPS);
  const visitQueue = Boolean(c.env.VISITS_QUEUE);
  const multipleDomains = domains.length > 1;
  const capabilities: DeploymentCapabilities = {
    profile: r2Backups || visitQueue || multipleDomains ? 'advanced' : 'basic',
    core: { d1: true, kv: true },
    advanced: {
      r2Backups,
      visitQueue,
      configuredDomains: domains.length,
      multipleDomains,
    },
  };
  return jsonOk(capabilities);
});

systemRoutes.get('/upgrade', (c) => {
  return jsonOk(getOnlineUpgradeCapability(c.env));
});

systemRoutes.post('/upgrade', async (c) => {
  if (!isAdminToken(c)) return jsonError('Instance admin token required', 403);

  try {
    const result = await dispatchOnlineUpgrade(c.env);
    await recordAudit(
      c.env,
      c.req.raw,
      'system.upgrade.triggered',
      'deployment',
      result.runId === null ? undefined : String(result.runId),
      {
        repository: c.env.LINKETRY_UPDATE_REPOSITORY,
        branch: c.env.LINKETRY_UPDATE_BRANCH || 'main',
      }
    );
    return jsonOk(result);
  } catch (error) {
    return onlineUpgradeError(error);
  }
});

systemRoutes.get('/upgrade/:runId', async (c) => {
  const value = c.req.param('runId');
  if (!/^\d+$/.test(value)) return jsonError('Invalid workflow run ID.', 400);

  try {
    return jsonOk(await readOnlineUpgradeRun(c.env, Number(value)));
  } catch (error) {
    return onlineUpgradeError(error);
  }
});

function onlineUpgradeError(error: unknown): Response {
  if (error instanceof OnlineUpgradeError) return jsonError(error.message, error.status);
  return jsonError('Online upgrade request failed.', 500);
}

export default systemRoutes;
