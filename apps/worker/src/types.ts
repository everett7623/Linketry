import type { VisitQueueMessage } from '@linketry/shared';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BACKUPS?: R2Bucket;
  VISITS_QUEUE?: Queue<VisitQueueMessage>;
  LINKETRY_ADMIN_TOKEN?: string;
  LINKETRY_VERSION?: string;
  LINKETRY_DAILY_CRON?: string;
  LINKETRY_HEALTH_CRON?: string;
  // One-release upgrade compatibility for existing Linkora deployments.
  ADMIN_TOKEN?: string;
  LINKORA_VERSION?: string;
  LINKORA_DAILY_CRON?: string;
  LINKORA_HEALTH_CRON?: string;
}
