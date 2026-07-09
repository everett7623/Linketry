import { Hono } from 'hono';
import type { ConversionEvent, Link } from '@linkora/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { createConversionEvent } from '../db/analytics';
import { getLinkByDomainAndSlug, getLinkById, getLinkBySlug } from '../db/index';
import { generateId, now, sha256 } from '../utils/id';
import { jsonError, jsonOk } from '../utils/response';

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

  const parsed = parseConversionBody(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const link = await resolveConversionLink(c.env, body);
  if (!link) return jsonError('Link not found', 404);

  const event: ConversionEvent = {
    id: generateId(),
    link_id: link.id,
    slug: link.slug,
    domain: link.domain ?? null,
    event_name: parsed.value!.event_name,
    value: parsed.value!.value,
    currency: parsed.value!.currency,
    metadata: parsed.value!.metadata,
    ip_hash: await hashRequestIp(c.req.raw),
    user_agent: c.req.header('User-Agent') ?? null,
    created_at: now(),
  };

  await createConversionEvent(c.env, event);
  return jsonOk(event, 201);
});

interface ConversionBody {
  link_id?: unknown;
  slug?: unknown;
  domain?: unknown;
  event_name?: unknown;
  value?: unknown;
  currency?: unknown;
  metadata?: unknown;
}

interface ConversionPayload {
  event_name: string;
  value: number | null;
  currency: string | null;
  metadata: string | null;
}

function parseConversionBody(body: ConversionBody): { value?: ConversionPayload; error?: string } {
  const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : '';
  if (!/^[a-zA-Z0-9_.:-]{1,80}$/.test(eventName)) {
    return { error: 'event_name must be 1-80 characters using letters, numbers, dot, underscore, colon, or dash' };
  }

  const value = parseOptionalNumber(body.value);
  if (value.error) return { error: value.error };

  const currency = typeof body.currency === 'string' && body.currency.trim()
    ? body.currency.trim().toUpperCase()
    : null;
  if (currency && !/^[A-Z0-9]{2,12}$/.test(currency)) {
    return { error: 'currency must be 2-12 uppercase letters or numbers' };
  }

  const metadata = stringifyMetadata(body.metadata);
  if (metadata.error) return { error: metadata.error };

  return { value: { event_name: eventName, value: value.value, currency, metadata: metadata.value } };
}

function parseOptionalNumber(value: unknown): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return { value: null, error: 'value must be a number' };
  return { value: parsed };
}

function stringifyMetadata(value: unknown): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text.length > 4000) return { value: null, error: 'metadata must be 4000 characters or less' };
  return { value: text };
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
