import type { Env } from '../types';
import { sha256 } from '../utils/id';

const DEFAULT_AUTH_LIMIT_PER_MINUTE = 20;
const KV_WINDOW_SECONDS = 60;

export interface AuthRateLimitResult {
  allowed: boolean;
  limit: number;
  retryAfterSeconds: number;
  source: 'binding' | 'kv' | 'open';
}

/**
 * Rate-limit login and password-gate attempts.
 * Prefer AUTH_RATE_LIMITER / DEMO_RATE_LIMITER binding; fall back to KV counters;
 * if neither is available, allow with a warning (production) — Demo paths should fail closed elsewhere.
 */
export async function checkAuthRateLimit(
  env: Pick<Env, 'AUTH_RATE_LIMITER' | 'DEMO_RATE_LIMITER' | 'KV'>,
  request: Request,
  bucket: 'login' | 'link-password'
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
