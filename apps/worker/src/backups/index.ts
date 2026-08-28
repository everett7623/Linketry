import type { Backup } from '@linketry/shared';
import type { Env } from '../types';
import {
  createBackupRecord,
  getAllLinks,
  getAllRedirectRules,
  getAllTags,
  getLinksPage,
  getSettings,
} from '../db/index';
import { generateId, now } from '../utils/id';
import { getRuntimeVersion } from '../config/runtime';
import { LINKETRY_BACKUP_NAME } from '../importers/backupFormat';

const BACKUP_LINK_PAGE_SIZE = 500;

export interface LinketryBackupPayload {
  name: typeof LINKETRY_BACKUP_NAME;
  version: string;
  exportedAt: string;
  links: Awaited<ReturnType<typeof getAllLinks>>;
  tags: Awaited<ReturnType<typeof getAllTags>>;
  redirectRules: Awaited<ReturnType<typeof getAllRedirectRules>>;
  settings: Record<string, string>;
}

export type BackupTrigger = 'manual' | 'scheduled' | 'pre-restore' | 'pre-reset';

export async function buildBackupPayload(env: Env): Promise<LinketryBackupPayload> {
  const [links, tags, redirectRules, settings] = await Promise.all([
    getAllLinks(env),
    getAllTags(env),
    getAllRedirectRules(env),
    getSettings(env),
  ]);

  return {
    name: LINKETRY_BACKUP_NAME,
    version: getRuntimeVersion(env),
    exportedAt: now(),
    links,
    tags,
    redirectRules,
    settings: redactBackupSettings(settings),
  };
}

/**
 * Streams the same backup JSON as `buildBackupPayload` without holding every link
 * in memory. Used by the `/export/backup.json` download; the `links` array is paged
 * from D1 while the bounded tag / rule / setting collections are emitted whole.
 */
export function streamBackupJson(env: Env): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const [tags, redirectRules, settings] = await Promise.all([
          getAllTags(env),
          getAllRedirectRules(env),
          getSettings(env),
        ]);

        controller.enqueue(
          encoder.encode(
            '{' +
              `"name":${JSON.stringify(LINKETRY_BACKUP_NAME)},` +
              `"version":${JSON.stringify(getRuntimeVersion(env))},` +
              `"exportedAt":${JSON.stringify(now())},` +
              '"links":['
          )
        );

        let cursor: { createdAt: string; id: string } | null = null;
        let first = true;
        for (;;) {
          const page = await getLinksPage(env, cursor, BACKUP_LINK_PAGE_SIZE);
          if (page.length === 0) break;
          for (const link of page) {
            controller.enqueue(encoder.encode((first ? '' : ',') + JSON.stringify(link)));
            first = false;
          }
          if (page.length < BACKUP_LINK_PAGE_SIZE) break;
          const last = page[page.length - 1];
          cursor = { createdAt: last.created_at, id: last.id };
        }

        controller.enqueue(
          encoder.encode(
            ']' +
              `,"tags":${JSON.stringify(tags)}` +
              `,"redirectRules":${JSON.stringify(redirectRules)}` +
              `,"settings":${JSON.stringify(redactBackupSettings(settings))}` +
              '}'
          )
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function createR2Backup(env: Env, trigger: BackupTrigger = 'manual'): Promise<Backup> {
  const createdAt = now();
  const objectKey = createBackupObjectKey(createdAt);
  const baseBackup: Backup = {
    id: generateId(),
    filename: objectKey,
    storage: 'r2',
    size: null,
    status: 'failed',
    created_at: createdAt,
  };

  if (!env.BACKUPS) {
    await createBackupRecord(env, baseBackup);
    throw new Error('R2 backup bucket is not configured');
  }

  const payload = await buildBackupPayload(env);
  const body = JSON.stringify(payload);
  const size = new TextEncoder().encode(body).byteLength;

  try {
    await env.BACKUPS.put(objectKey, body, {
      httpMetadata: { contentType: 'application/json; charset=utf-8' },
      customMetadata: {
        trigger,
        created_at: createdAt,
        version: payload.version,
      },
    });

    const backup: Backup = {
      ...baseBackup,
      size,
      status: 'completed',
    };
    await createBackupRecord(env, backup);
    return backup;
  } catch (error) {
    await createBackupRecord(env, {
      ...baseBackup,
      size,
      status: 'failed',
    });
    throw error;
  }
}

export function backupDownloadName(filename: string): string {
  const parts = filename.split('/');
  return parts[parts.length - 1] || filename;
}

function createBackupObjectKey(createdAt: string): string {
  const stamp = createdAt.slice(0, 19).replace(/[-:T]/g, '');
  return `backups/linketry-backup-${stamp}.json`;
}

function redactBackupSettings(settings: Record<string, string>): Record<string, string> {
  const redacted = { ...settings };
  if ('webhook_secret' in redacted) {
    redacted.webhook_secret = '';
  }
  delete redacted.notification_channels;
  delete redacted.health_alert_state;
  delete redacted.health_check_history;
  delete redacted.public_stats_shares;
  delete redacted.health_monitoring_cursor;
  delete redacted.analytics_report_records;
  return redacted;
}
