import { Hono } from 'hono';
import type { ConversionEvent, Link } from '@linketry/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { createConversionEvent } from '../db/analytics';
import { getLinkByDomainAndSlug, getLinkById, getLinkBySlug } from '../db/index';
import { generateId, now, sha256 } from '../utils/id';
import { jsonError, jsonOk } from '../utils/response';
import { parseConversionInput } from '../analytics/conversionPolicy';

const conversions = new Hono<{ Bindings: Env }>();

conversions.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'write');
  if (authError) return authError;
  await next();
});

conversions.post('/', async (c) => {
  let body: ConversionBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = parseConversionInput(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const link = await resolveConversionLink(c.env, body);
  if (!link) return jsonError('Link not found', 404);

  const event: ConversionEvent = {
    id: parsed.value!.eventId ?? generateId(),
    link_id: link.id,
    slug: link.slug,
    domain: link.domain ?? null,
    event_name: parsed.value!.eventName,
    value: parsed.value!.value,
    currency: parsed.value!.currency,
    metadata: parsed.value!.metadata,
    ip_hash: await hashRequestIp(c.req.raw),
    user_agent: c.req.header('User-Agent') ?? null,
    created_at: now(),
  };

  const inserted = await createConversionEvent(c.env, event);
  if (inserted) return jsonOk({ ...event, duplicate: false }, 201);
  return jsonOk({ id: event.id, duplicate: true }, 200);
});

interface ConversionBody {
  event_id?: unknown;
  link_id?: unknown;
  slug?: unknown;
  domain?: unknown;
  event_name?: unknown;
  value?: unknown;
  currency?: unknown;
  metadata?: unknown;
}

async function resolveConversionLink(env: Env, body: ConversionBody): Promise<Link | null> {
  const id = typeof body.link_id === 'string' ? body.link_id.trim() : '';
  if (id) return getLinkById(env, id);

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) return null;

  const domain = typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : '';
  return domain ? getLinkByDomainAndSlug(env, domain, slug) : getLinkBySlug(env, slug);
}

async function hashRequestIp(request: Request): Promise<string | null> {
  const ip = request.headers.get('CF-Connecting-IP');
  return ip ? sha256(ip) : null;
}

export default conversions;
