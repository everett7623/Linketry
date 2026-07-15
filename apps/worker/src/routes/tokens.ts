import { Hono } from 'hono';
import type { Context } from 'hono';
import type { ApiTokenScope } from '@linketry/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { createApiTokenRecord, listApiTokens, revokeApiToken } from '../db/index';
import { recordAudit } from '../audit/index';
import { jsonCreated, jsonError, jsonOk } from '../utils/response';
import { generateId, now, sha256 } from '../utils/id';

const tokenRoutes = new Hono<{ Bindings: Env }>();

const VALID_SCOPES: ApiTokenScope[] = ['read', 'write', 'admin'];

tokenRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

tokenRoutes.get('/', async (c) => {
  const tokens = await listApiTokens(c.env);
  return jsonOk(tokens);
});

tokenRoutes.post('/', async (c) => {
  let body: { name?: unknown; scopes?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = parseTokenBody(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const token = generateApiToken();
  const ts = now();
  const apiToken = {
    id: generateId(),
    name: parsed.name!,
    scopes: parsed.scopes!,
    last_used_at: null,
    created_at: ts,
    revoked_at: null,
  };

  await createApiTokenRecord(c.env, {
    ...apiToken,
    token_hash: await sha256(token),
    scopes: JSON.stringify(apiToken.scopes),
  });
  await recordAudit(c.env, c.req.raw, 'api_token.create', 'api_token', apiToken.id, {
    name: apiToken.name,
    scopes: apiToken.scopes,
  });

  return jsonCreated({
    token,
    item: apiToken,
  });
});

tokenRoutes.post('/:id/revoke', async (c) => {
  return revoke(c, c.req.param('id'));
});

tokenRoutes.delete('/:id', async (c) => {
  return revoke(c, c.req.param('id'));
});

async function revoke(c: Context<{ Bindings: Env }>, id: string): Promise<Response> {
  const revokedAt = now();
  const revoked = await revokeApiToken(c.env, id, revokedAt);
  if (!revoked) return jsonError('API token not found or already revoked', 404);

  await recordAudit(c.env, c.req.raw, 'api_token.revoke', 'api_token', id);
  return jsonOk({ message: 'API token revoked', revokedAt });
}

function parseTokenBody(body: { name?: unknown; scopes?: unknown }): {
  name?: string;
  scopes?: ApiTokenScope[];
  error?: string;
} {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'name is required' };
  if (name.length > 80) return { error: 'name must be 80 characters or less' };

  const scopes = Array.isArray(body.scopes)
    ? body.scopes.map(String)
    : typeof body.scopes === 'string'
      ? body.scopes.split(',')
      : [];

  const parsedScopes = [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))]
    .filter((scope): scope is ApiTokenScope => VALID_SCOPES.includes(scope as ApiTokenScope));

  if (parsedScopes.length === 0) return { error: 'At least one scope is required' };
  if (parsedScopes.includes('admin')) return { name, scopes: ['admin'] };

  return { name, scopes: parsedScopes };
}

function generateApiToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `lk_${secret}`;
}

export default tokenRoutes;
