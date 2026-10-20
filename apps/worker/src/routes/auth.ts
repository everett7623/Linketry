import { Hono } from 'hono';
import type { Env } from '../types';
import { jsonOk, jsonError } from '../utils/response';
import { getAdminToken } from '../config/runtime';
import { isPublicReadOnlyDemo } from '../demo/policy';
import { timingSafeEqualString } from '../utils/password';
import { checkAuthRateLimit } from '../auth/rateLimit';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  // 限流存储故障由 checkAuthRateLimit 内部按策略处理，不再被误报成请求体错误
  const rate = await checkAuthRateLimit(c.env, c.req.raw, 'login');
  c.header('X-RateLimit-Limit', String(rate.limit));
  if (!rate.allowed) {
    c.header('Retry-After', String(rate.retryAfterSeconds));
    return rate.source === 'unavailable'
      ? jsonError('Sign-in is temporarily unavailable. Please try again shortly.', 503)
      : jsonError('Too many login attempts. Please try again shortly.', 429);
  }

  let body: { token?: unknown } | null;
  try {
    body = await c.req.json<{ token?: unknown } | null>();
  } catch {
    return jsonError('Invalid request body', 400);
  }

  const token = typeof body?.token === 'string' ? body.token : '';
  if (!token) {
    return jsonError('Token is required', 400);
  }

  const adminToken = getAdminToken(c.env);
  if (!adminToken || !timingSafeEqualString(token, adminToken)) {
    return jsonError('Invalid token', 401);
  }

  return jsonOk({ authenticated: true, message: 'Login successful' });
});

auth.get('/me', (c) => {
  if (isPublicReadOnlyDemo(c.env)) {
    return jsonOk({ authenticated: true, role: 'demo', readOnly: true });
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Unauthorized', 401);
  }
  const token = authHeader.slice(7);
  const adminToken = getAdminToken(c.env);
  if (!adminToken || !timingSafeEqualString(token, adminToken)) {
    return jsonError('Unauthorized', 401);
  }
  return jsonOk({ authenticated: true, role: 'admin' });
});

auth.post('/logout', (c) => {
  return jsonOk({ message: 'Logged out' });
});

export default auth;
