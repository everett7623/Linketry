import type { KVCacheEntry } from '@linketry/shared';
import type { Env } from '../types';

const KV_TTL_DEFAULT = 60 * 60 * 24; // 24 小时（默认）
const KV_TTL_HOT = 60 * 60 * 24 * 7; // 7 天（热门链接）
const KV_TTL_WARM = 60 * 60 * 24 * 3; // 3 天（常用链接）
const KV_TTL_COLD = 60 * 60; // 1 小时（冷门链接）

function kvKey(domain: string, slug: string): string {
  return `linketry:slug:${domain}:${slug}`;
}

/**
 * 智能 TTL 策略
 * 根据点击量动态调整缓存时间
 */
function calculateSmartTTL(entry: KVCacheEntry): number {
  // KVCacheEntry 不包含 clicks，这里使用默认策略
  // 实际的点击数应该从 D1 查询后决定 TTL
  let ttl = KV_TTL_DEFAULT;

  // 如果有过期时间，不超过过期时间
  if (entry.expiresAt) {
    const expiresIn = new Date(entry.expiresAt).getTime() - Date.now();
    if (expiresIn > 0) {
      ttl = Math.min(ttl, Math.floor(expiresIn / 1000));
    } else {
      // 已过期，缓存 5 分钟用于显示过期页面
      ttl = 300;
    }
  }

  // 如果有点击限制，根据剩余点击数调整
  // 注意：KVCacheEntry 不包含当前点击数，需要从 D1 获取
  if (entry.maxClicks) {
    // 接近限制，缓存时间缩短
    ttl = Math.min(ttl, 60 * 30); // 最多 30 分钟
  }

  return ttl;
}

export async function getCachedLink(
  env: Env,
  domain: string,
  slug: string
): Promise<KVCacheEntry | null> {
  try {
    const key = kvKey(domain, slug);
    return (await env.KV.get(key, 'json')) as KVCacheEntry | null;
  } catch {
    return null;
  }
}

export async function setCachedLink(env: Env, domain: string, entry: KVCacheEntry): Promise<void> {
  try {
    const key = kvKey(domain, entry.slug);
    const ttl = calculateSmartTTL(entry);
    await env.KV.put(key, JSON.stringify(entry), { expirationTtl: ttl });
  } catch {
    // Cache errors must not affect redirects
  }
}

export async function deleteCachedLink(env: Env, domain: string, slug: string): Promise<void> {
  try {
    await env.KV.delete(kvKey(domain, slug));
  } catch {
    // Ignore cache errors
  }
}
