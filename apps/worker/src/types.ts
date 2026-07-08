import type { VisitQueueMessage } from '@linkora/shared';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BACKUPS?: R2Bucket;
  VISITS_QUEUE?: Queue<VisitQueueMessage>;
  ADMIN_TOKEN: string;
  LINKORA_VERSION: string;
}
