import type { KVCacheEntry } from '@linkora/shared';
import type { Link } from '@linkora/shared';
import type { Env } from '../types';

const KV_TTL = 60 * 60 * 24; // 24 hours

function kvKey(domain: string, slug: string): string {
  return `linkora:slug:${domain}:${slug}`;
}

export async function getCachedLink(
  env: Env,
  domain: string,
  slug: string
): Promise<KVCacheEntry | null> {
  try {
    const key = kvKey(domain, slug);
    const value = await env.KV.get(key, 'json');
    return (value as KVCacheEntry | null) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedLink(env: Env, domain: string, entry: KVCacheEntry): Promise<void> {
  try {
    const key = kvKey(domain, entry.slug);
    await env.KV.put(key, JSON.stringify(entry), { expirationTtl: KV_TTL });
  } catch {
    // Cache errors must not affect redirects
  }
}

export async function deleteCachedLink(env: Env, domain: string, slug: string): Promise<void> {
  try {
    const key = kvKey(domain, slug);
    await env.KV.delete(key);
  } catch {
    // Ignore cache errors
  }
}

export function linkToCacheEntry(link: Link): KVCacheEntry {
  return {
    id: link.id,
    slug: link.slug,
    domain: link.domain ?? undefined,
    longUrl: link.long_url,
    redirectType: link.redirect_type,
    status: link.status,
    expiresAt: link.expires_at ?? undefined,
    maxClicks: link.max_clicks ?? undefined,
    warningEnabled: link.warning_enabled === 1,
  };
}
