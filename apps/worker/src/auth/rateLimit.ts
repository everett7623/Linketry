import type { Env } from '../types';
import { sha256 } from '../utils/id';

const DEFAULT_AUTH_LIMIT_PER_MINUTE = 20;
const KV_WINDOW_SECONDS = 60;

export type AuthRateLimitBucket = 'login' | 'link-password';

export interface AuthRateLimitResult {
  allowed: boolean;
  limit: number;
  retryAfterSeconds: number;
  /** `unavailable`：限流存储本身出错，结果由 rateLimiterFailureResult 决定。 */
  source: 'binding' | 'kv' | 'open' | 'unavailable';
}

/**
 * 限流存储（Rate Limiting binding 或 KV 计数器）抛错时返回的结果。
 *
 * 典型触发：Workers 免费版 KV 每天 1000 次写入用尽后，put() 会一直抛错到 UTC 零点；
 * 每次被放行的尝试都会写一次 KV，所以攻击者自己就能把额度耗尽。
 * 调用方约定：allowed 为 false 且 source 为 'unavailable' 时返回 503，而不是 429。
 */
export function rateLimiterFailureResult(bucket: AuthRateLimitBucket): AuthRateLimitResult {
  return {
    // login 放行：管理员 bearer token 本来就能直接调用不限流的 /api/v1/*，真正的防线是 token 的熵；
    // 拒绝只会在额度耗尽时把管理员锁在外面。
    // link-password 拒绝：用户自设的低熵口令只靠这道限流，而攻击者能主动刷光 KV 写入额度。
    allowed: bucket === 'login',
    limit: DEFAULT_AUTH_LIMIT_PER_MINUTE,
    retryAfterSeconds: KV_WINDOW_SECONDS,
    source: 'unavailable',
  };
}

/**
 * Rate-limit login and password-gate attempts.
 * Prefer AUTH_RATE_LIMITER / DEMO_RATE_LIMITER binding; fall back to KV counters;
 * if neither is available, allow with a warning (production) — Demo paths should fail closed elsewhere.
 * Storage errors never propagate: they resolve through rateLimiterFailureResult.
 */
export async function checkAuthRateLimit(
  env: Pick<Env, 'AUTH_RATE_LIMITER' | 'DEMO_RATE_LIMITER' | 'KV'>,
  request: Request,
  bucket: AuthRateLimitBucket
): Promise<AuthRateLimitResult> {
  try {
    return await checkConfiguredRateLimit(env, request, bucket);
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: 'Auth rate limiter failed',
        bucket,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return rateLimiterFailureResult(bucket);
  }
}

async function checkConfiguredRateLimit(
  env: Pick<Env, 'AUTH_RATE_LIMITER' | 'DEMO_RATE_LIMITER' | 'KV'>,
  request: Request,
  bucket: AuthRateLimitBucket
): Promise<AuthRateLimitResult> {
  const clientAddress =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown';
  const keyMaterial = `linketry-auth:${bucket}:${clientAddress}`;
  const clientHash = await sha256(keyMaterial);

  const limiter = env.AUTH_RATE_LIMITER ?? env.DEMO_RATE_LIMITER;
  if (limiter) {
    const outcome = await limiter.limit({ key: clientHash });
    return {
      allowed: outcome.success,
      limit: DEFAULT_AUTH_LIMIT_PER_MINUTE,
      retryAfterSeconds: 60,
      source: 'binding',
    };
  }

  if (env.KV) {
    const kvKey = `linketry:ratelimit:auth:${bucket}:${clientHash}`;
    const currentRaw = await env.KV.get(kvKey);
    const current = Number(currentRaw ?? '0');
    if (Number.isFinite(current) && current >= DEFAULT_AUTH_LIMIT_PER_MINUTE) {
      return {
        allowed: false,
        limit: DEFAULT_AUTH_LIMIT_PER_MINUTE,
        retryAfterSeconds: KV_WINDOW_SECONDS,
        source: 'kv',
      };
    }
    await env.KV.put(kvKey, String((Number.isFinite(current) ? current : 0) + 1), {
      expirationTtl: KV_WINDOW_SECONDS,
    });
    return {
      allowed: true,
      limit: DEFAULT_AUTH_LIMIT_PER_MINUTE,
      retryAfterSeconds: KV_WINDOW_SECONDS,
      source: 'kv',
    };
  }

  console.warn(
    JSON.stringify({
      message: 'Auth rate limiter unavailable; allowing request',
      bucket,
    })
  );
  return {
    allowed: true,
    limit: DEFAULT_AUTH_LIMIT_PER_MINUTE,
    retryAfterSeconds: 60,
    source: 'open',
  };
}
