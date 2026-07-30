import type { KVCacheEntry } from '@linketry/shared';
import type { Env } from '../types';

const KV_TTL_DEFAULT = 60 * 60 * 24; // 24 小时（默认）
/** Cloudflare KV expirationTtl 最小值为 60 秒 */
const KV_TTL_MIN = 60;

export function kvKey(domain: string, slug: string): string {
  return `linketry:slug:${domain}:${slug}`;
}

/**
 * 计算 KV 缓存 TTL（秒）
 *
 * 返回 null 表示链接已过期，不应写入缓存；
 * 这样重定向路径会直接查 D1，拿到最新状态。
 */
function calculateTTL(entry: KVCacheEntry): number | null {
  let ttl = KV_TTL_DEFAULT;

  if (entry.expiresAt) {
    const expiresIn = new Date(entry.expiresAt).getTime() - Date.now();
    if (expiresIn <= 0) {
      // 已过期——不写入缓存，交由重定向路径从 D1 读取最新状态
      return null;
    }
    // 不超过过期时间，且满足 KV 最小 TTL 要求（60s）
    ttl = Math.min(ttl, Math.max(KV_TTL_MIN, Math.floor(expiresIn / 1000)));
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

/**
 * 写入 KV 缓存。
 * 返回 true 表示写入成功，false 表示跳过（链接已过期）或写入失败。
 * 缓存错误永远不向外抛出，不影响重定向路径。
 */
export async function setCachedLink(env: Env, domain: string, entry: KVCacheEntry): Promise<boolean> {
  try {
    const ttl = calculateTTL(entry);
    if (ttl === null) return false; // 已过期，不写入缓存
    const key = kvKey(domain, entry.slug);
    await env.KV.put(key, JSON.stringify(entry), { expirationTtl: ttl });
    return true;
  } catch {
    // Cache errors must not affect redirects
    return false;
  }
}

export async function deleteCachedLink(env: Env, domain: string, slug: string): Promise<void> {
  try {
    await env.KV.delete(kvKey(domain, slug));
  } catch {
    // Ignore cache errors
  }
}
