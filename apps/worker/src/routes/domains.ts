import { Hono } from 'hono';
import type { Domain } from '@linketry/shared';
import { validateDomain } from '@linketry/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  clearDefaultDomains,
  createDomain,
  deleteDomain,
  getDomainById,
  getDomainByName,
  listDomains,
  setDefaultDomain,
  setSetting,
  updateDomain,
} from '../db/index';
import { recordAudit } from '../audit/index';
import { jsonCreated, jsonError, jsonOk } from '../utils/response';
import { generateId, now } from '../utils/id';

const domainRoutes = new Hono<{ Bindings: Env }>();

domainRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

domainRoutes.get('/', async (c) => {
  const domains = await listDomains(c.env);
  return jsonOk(domains);
});

domainRoutes.post('/', async (c) => {
  let body: { domain?: unknown; is_default?: unknown; status?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = parseDomainBody(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const existing = await getDomainByName(c.env, parsed.domain!);
  if (existing) return jsonError(`Domain "${parsed.domain}" already exists`, 409);

  const ts = now();
  if (parsed.is_default) await clearDefaultDomains(c.env, ts);

  const domain: Domain = {
    id: generateId(),
    domain: parsed.domain!,
    is_default: parsed.is_default ? 1 : 0,
    status: parsed.status!,
    created_at: ts,
    updated_at: ts,
  };

  await createDomain(c.env, domain);
  if (domain.is_default === 1) {
    await setSetting(c.env, 'default_domain', domain.domain, ts);
  }
  await recordAudit(c.env, c.req.raw, 'domain.create', 'domain', domain.id, {
    domain: domain.domain,
    is_default: domain.is_default,
  });

  return jsonCreated(domain);
});

domainRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getDomainById(c.env, id);
  if (!existing) return jsonError('Domain not found', 404);

  let body: { domain?: unknown; is_default?: unknown; status?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = parseDomainBody(body, existing);
  if (parsed.error) return jsonError(parsed.error, 400);

  const conflict = await getDomainByName(c.env, parsed.domain!);
  if (conflict && conflict.id !== id) return jsonError(`Domain "${parsed.domain}" already exists`, 409);

  const ts = now();
  if (parsed.is_default) await clearDefaultDomains(c.env, ts);

  const updated: Domain = {
    ...existing,
    domain: parsed.domain!,
    is_default: parsed.is_default ? 1 : 0,
    status: parsed.status!,
    updated_at: ts,
  };

  await updateDomain(c.env, id, updated);
  if (updated.is_default === 1) {
    await setSetting(c.env, 'default_domain', updated.domain, ts);
  }
  await recordAudit(c.env, c.req.raw, 'domain.update', 'domain', id, {
    domain: updated.domain,
    is_default: updated.is_default,
    status: updated.status,
  });

  return jsonOk(updated);
});

domainRoutes.delete('/:id', async (c) => {
  const existing = await getDomainById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Domain not found', 404);

  await deleteDomain(c.env, existing.id);
  if (existing.is_default === 1) {
    await setSetting(c.env, 'default_domain', '', now());
  }
  await recordAudit(c.env, c.req.raw, 'domain.delete', 'domain', existing.id, {
    domain: existing.domain,
  });
  return jsonOk({ message: 'Domain deleted' });
});

domainRoutes.post('/:id/set-default', async (c) => {
  const existing = await getDomainById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Domain not found', 404);

  const ts = now();
  await setDefaultDomain(c.env, existing.id, ts);
  await setSetting(c.env, 'default_domain', existing.domain, ts);
  await recordAudit(c.env, c.req.raw, 'domain.set_default', 'domain', existing.id, {
    domain: existing.domain,
  });

  return jsonOk({ message: 'Default domain updated', domain: existing.domain });
});

function parseDomainBody(
  body: { domain?: unknown; is_default?: unknown; status?: unknown },
  fallback?: Domain
): { domain?: string; is_default?: boolean; status?: Domain['status']; error?: string } {
  const rawDomain = body.domain === undefined ? fallback?.domain : body.domain;
  if (typeof rawDomain !== 'string') return { error: 'domain is required' };

  const validation = validateDomain(rawDomain);
  if (!validation.valid) return { error: validation.error };

  const status = parseStatus(body.status, fallback?.status);
  if (!status) return { error: 'status must be active or disabled' };

  return {
    domain: validation.domain!,
    is_default: parseBoolean(body.is_default, fallback?.is_default === 1),
    status,
  };
}

function parseStatus(value: unknown, fallback: Domain['status'] = 'active'): Domain['status'] | null {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === 'active' || value === 'disabled') return value;
  return null;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === true || value === 1 || value === '1' || value === 'true';
}

export default domainRoutes;
