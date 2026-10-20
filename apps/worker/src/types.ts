import type { VisitQueueMessage } from '@linketry/shared';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS?: Fetcher;
  BACKUPS?: R2Bucket;
  VISITS_QUEUE?: Queue<VisitQueueMessage>;
  DEMO_RATE_LIMITER?: RateLimit;
  AUTH_RATE_LIMITER?: RateLimit;
  LINKETRY_ADMIN_TOKEN?: string;
  LINKETRY_VERSION?: string;
  LINKETRY_DAILY_CRON?: string;
  LINKETRY_HEALTH_CRON?: string;
  LINKETRY_DEMO_MODE?: string;
  /** Explicit allow for official Demo only; required with LINKETRY_DEMO_MODE=read-only outside linketry-demo-* naming. */
  LINKETRY_DEMO_ALLOW?: string;
  LINKETRY_CORS_ORIGINS?: string;
  /** 可选：存储访客 IP 哈希时使用的 HMAC-SHA256 密钥；未设置时沿用 SHA-256。 */
  LINKETRY_IP_HASH_SECRET?: string;
  LINKETRY_GITHUB_UPDATE_TOKEN?: string;
  LINKETRY_UPDATE_REPOSITORY?: string;
  LINKETRY_UPDATE_BRANCH?: string;
}
