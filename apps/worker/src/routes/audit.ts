import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { listAuditLogs } from '../db/index';
import { jsonOk } from '../utils/response';

const auditRoutes = new Hono<{ Bindings: Env }>();

auditRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

auditRoutes.get('/', async (c) => {
  const action = c.req.query('action');
  const targetType = c.req.query('targetType');
  const keyword = c.req.query('keyword');
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') ?? '50', 10), 100);

  const { items, total } = await listAuditLogs(c.env, {
    action,
    targetType,
    keyword,
    page,
    pageSize,
  });

  return jsonOk({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default auditRoutes;
