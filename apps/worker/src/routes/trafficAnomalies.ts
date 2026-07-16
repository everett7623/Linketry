import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  getTrafficAnomalyStatus,
  runScheduledTrafficAnomalyCheck,
  saveTrafficAnomalyConfig,
} from '../analytics/trafficAnomalies';
import { jsonError, jsonOk } from '../utils/response';

const trafficAnomalies = new Hono<{ Bindings: Env }>();

trafficAnomalies.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

trafficAnomalies.get('/', async (c) => jsonOk(await getTrafficAnomalyStatus(c.env)));

trafficAnomalies.put('/config', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  try {
    const config = await saveTrafficAnomalyConfig(c.env, body);
    return jsonOk(config);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Invalid traffic anomaly configuration',
      400
    );
  }
});

trafficAnomalies.post('/run', async (c) => {
  const decision = await runScheduledTrafficAnomalyCheck(c.env);
  return decision ? jsonOk(decision) : jsonError('Traffic anomaly alerts are disabled', 409);
});

export default trafficAnomalies;
