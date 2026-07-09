import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getAnalyticsSummary, getLinkAnalytics, parseAnalyticsFilters } from '../db/analytics';
import { jsonError, jsonOk } from '../utils/response';

const analyticsRoutes = new Hono<{ Bindings: Env }>();

analyticsRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

analyticsRoutes.get('/', async (c) => {
  const summary = await getAnalyticsSummary(c.env, parseAnalyticsFilters((key) => c.req.query(key)));
  return jsonOk(summary);
});

analyticsRoutes.get('/links/:id', async (c) => {
  const result = await getLinkAnalytics(c.env, c.req.param('id'), parseAnalyticsFilters((key) => c.req.query(key)));
  if (!result.link) return jsonError('Link not found', 404);
  return jsonOk(result);
});

export default analyticsRoutes;
