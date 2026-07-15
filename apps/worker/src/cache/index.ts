import type { KVCacheEntry } from '@linketry/shared';
import type { Env } from '../types';

const KV_TTL = 60 * 60 * 24; // 24 hours

function kvKey(domain: string, slug: string): string {
  return `linketry:slug:${domain}:${slug}`;
}

function legacyKvKey(domain: string, slug: string): string {
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
    if (value) return value as KVCacheEntry;
    const legacyValue = await env.KV.get(legacyKvKey(domain, slug), 'json');
    return (legacyValue as KVCacheEntry | null) ?? null;
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
    await Promise.all([
      env.KV.delete(kvKey(domain, slug)),
      env.KV.delete(legacyKvKey(domain, slug)),
    ]);
  } catch {
    // Ignore cache errors
  }
}
