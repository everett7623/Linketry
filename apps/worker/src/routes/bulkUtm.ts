import { Hono } from 'hono';
import type { Link } from '@linketry/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { deleteCachedLink } from '../cache/index';
import { getLinksByIds, listLinks, type ListLinksOptions } from '../db/index';
import { updateBulkUtmLinks } from '../db/bulkUtm';
import { recordAudit } from '../audit/index';
import { now } from '../utils/id';
import { jsonError, jsonOk } from '../utils/response';
import {
  applyBulkUtmPolicy,
  bulkUtmCsv,
  MAX_BULK_UTM_LINKS,
  parseBulkUtmPolicy,
  type BulkUtmPolicy,
} from '../links/bulkUtm';
import { bulkUtmCacheTargets } from '../links/bulkUtmCache';

const bulkUtm = new Hono<{ Bindings: Env }>();

const FILTER_KEYS = [
  'keyword',
  'tag',
  'status',
  'source',
  'domain',
  'createdFrom',
  'createdTo',
  'hasPassword',
  'warning',
  'limits',
  'sort',
] as const;

interface ScopeResult {
  type: 'selected' | 'filtered';
  links: Link[];
  total: number;
  requested: number;
  notFound: number;
}

interface ConfirmItem {
  id?: unknown;
  current_url?: unknown;
  next_url?: unknown;
}

function parseFilters(value: unknown): ListLinksOptions {
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  const filters: ListLinksOptions = {};
  for (const key of FILTER_KEYS) {
    if (typeof source[key] === 'string' && source[key].trim()) filters[key] = source[key].trim();
  }
  return filters;
}

async function resolveScope(env: Env, value: unknown): Promise<{ result?: ScopeResult; error?: string }> {
  if (!value || typeof value !== 'object') return { error: 'scope is required' };
  const scope = value as Record<string, unknown>;
  if (scope.type === 'selected') {
    const rawIds = Array.isArray(scope.ids) ? scope.ids : [];
    const ids = [...new Set(rawIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))];
    if (ids.length === 0) return { error: 'Select at least one link' };
    if (ids.length > MAX_BULK_UTM_LINKS) return { error: `Select at most ${MAX_BULK_UTM_LINKS} links` };
    const links = await getLinksByIds(env, ids);
    return { result: { type: 'selected', links, total: links.length, requested: ids.length, notFound: ids.length - links.length } };
  }
  if (scope.type === 'filtered') {
    const { items, total } = await listLinks(env, {
      ...parseFilters(scope.filters),
      page: 1,
      pageSize: MAX_BULK_UTM_LINKS,
    });
    return { result: { type: 'filtered', links: items, total, requested: total, notFound: 0 } };
  }
  return { error: 'scope.type must be selected or filtered' };
}

function previewItem(link: Link, policy: BulkUtmPolicy) {
  const result = applyBulkUtmPolicy(link.long_url, policy);
  return {
    id: link.id,
    slug: link.slug,
    current_url: link.long_url,
    next_url: result.nextUrl,
    status: result.status,
    conflicts: result.conflicts,
    error: result.error ?? null,
  };
}

function requestDomain(requestUrl: string): string {
  return new URL(requestUrl).hostname.toLowerCase();
}

async function clearChangedCache(env: Env, links: Link[], fallbackDomain: string): Promise<void> {
  const targets = bulkUtmCacheTargets(links, fallbackDomain);
  for (let index = 0; index < targets.length; index += 25) {
    await Promise.all(targets.slice(index, index + 25).map((target) =>
      deleteCachedLink(env, target.domain, target.slug)
    ));
  }
}

bulkUtm.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

bulkUtm.post('/preview', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const parsedPolicy = parseBulkUtmPolicy(body.mode, body.parameters, body.values);
  if (!parsedPolicy.policy) return jsonError(parsedPolicy.error ?? 'Invalid UTM policy', 400);
  const resolved = await resolveScope(c.env, body.scope);
  if (!resolved.result) return jsonError(resolved.error ?? 'Invalid scope', 400);

  const scope = resolved.result;
  if (scope.total > MAX_BULK_UTM_LINKS) {
    return jsonOk({
      scope: { type: scope.type, total: scope.total, requested: scope.requested, not_found: scope.notFound },
      items: [],
      ready: 0,
      unchanged: 0,
      invalid: 0,
      conflicts: 0,
      limit: MAX_BULK_UTM_LINKS,
      limit_exceeded: true,
    });
  }

  const items = scope.links.map((link) => previewItem(link, parsedPolicy.policy!));
  return jsonOk({
    scope: { type: scope.type, total: scope.total, requested: scope.requested, not_found: scope.notFound },
    items,
    ready: items.filter((item) => item.status === 'ready').length,
    unchanged: items.filter((item) => item.status === 'unchanged').length,
    invalid: items.filter((item) => item.status === 'invalid').length,
    conflicts: items.filter((item) => item.conflicts.length > 0).length,
    limit: MAX_BULK_UTM_LINKS,
    limit_exceeded: false,
  });
});

bulkUtm.post('/confirm', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const parsedPolicy = parseBulkUtmPolicy(body.mode, body.parameters, body.values);
  if (!parsedPolicy.policy) return jsonError(parsedPolicy.error ?? 'Invalid UTM policy', 400);
  if (!Array.isArray(body.items) || body.items.length === 0) return jsonError('items must be a non-empty array', 400);
  if (body.items.length > MAX_BULK_UTM_LINKS) return jsonError(`Confirm at most ${MAX_BULK_UTM_LINKS} links`, 400);

  const requested = body.items as ConfirmItem[];
  const ids = requested.flatMap((item) => typeof item.id === 'string' ? [item.id] : []);
  if (ids.length !== requested.length || new Set(ids).size !== requested.length) {
    return jsonError('Each confirm item must have a unique id', 400);
  }
  const existing = await getLinksByIds(c.env, ids);
  const byId = new Map(existing.map((link) => [link.id, link]));
  const candidates: Array<{ link: Link; currentUrl: string; nextUrl: string }> = [];

  for (const item of requested) {
    const link = byId.get(item.id as string);
    if (!link || typeof item.current_url !== 'string' || typeof item.next_url !== 'string') continue;
    if (link.long_url !== item.current_url) continue;
    const recomputed = applyBulkUtmPolicy(link.long_url, parsedPolicy.policy);
    if (recomputed.status !== 'ready' || recomputed.nextUrl !== item.next_url) continue;
    candidates.push({ link, currentUrl: link.long_url, nextUrl: recomputed.nextUrl });
  }

  const updatedAt = now();
  const changedUpdates = await updateBulkUtmLinks(c.env, candidates.map((item) => ({
    id: item.link.id,
    currentUrl: item.currentUrl,
    nextUrl: item.nextUrl,
  })), updatedAt);
  const changedIds = new Set(changedUpdates.map((item) => item.id));
  const changed = candidates.filter((item) => changedIds.has(item.link.id));
  await clearChangedCache(c.env, changed.map((item) => item.link), requestDomain(c.req.url));

  await recordAudit(c.env, c.req.raw, 'link.bulk_utm', 'link', undefined, {
    mode: parsedPolicy.policy.mode,
    parameters: parsedPolicy.policy.parameters,
    requested: requested.length,
    changed: changed.length,
    skipped: requested.length - changed.length,
    ids: changed.map((item) => item.link.id),
  });
  return jsonOk({
    mode: parsedPolicy.policy.mode,
    parameters: parsedPolicy.policy.parameters,
    total: requested.length,
    changed: changed.length,
    skipped: requested.length - changed.length,
    change_csv: bulkUtmCsv(changed.map((item) => ({
      id: item.link.id,
      slug: item.link.slug,
      oldUrl: item.currentUrl,
      newUrl: item.nextUrl,
    })), parsedPolicy.policy, updatedAt),
  });
});

export default bulkUtm;
