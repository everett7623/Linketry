import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getLinksPage, getVisitsPage, type RowCursor } from '../db/index';
import { getAnalyticsSummary, parseAnalyticsFilters } from '../db/analytics';
import { analyticsCsv } from '../export/analyticsCsv';
import { streamBackupJson } from '../backups/index';
import { sanitizeLink } from '../utils/linkSanitize';
import { csvRow } from '../utils/csv';
import { isPublicReadOnlyDemo } from '../demo/policy';
import type { Link, Visit } from '@linketry/shared';

const exportRoutes = new Hono<{ Bindings: Env }>();

/** Rows fetched from D1 per page while streaming an export. */
const EXPORT_PAGE_SIZE = 1000;

exportRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

/**
 * Raw dumps carry password hashes and visitor IP hashes, so they need admin scope.
 * Demo mode short-circuits read auth entirely, so it is refused outright there.
 */
async function requireRawDumpAccess(c: Context<{ Bindings: Env }>): Promise<Response | null> {
  if (isPublicReadOnlyDemo(c.env)) {
    return new Response(JSON.stringify({ success: false, error: 'Raw exports are disabled on the public demo' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return requireAuth(c, 'admin');
}

function toRowCursor(row: { created_at: string; id: string }): RowCursor {
  return { createdAt: row.created_at, id: row.id };
}

/** Streams a CSV file page by page so a large table never lands in Worker memory at once. */
function streamCsv<T extends { created_at: string; id: string }>(
  filename: string,
  headerColumns: string[],
  fetchPage: (cursor: RowCursor | null) => Promise<T[]>,
  toColumns: (row: T) => Array<string | number | null | undefined>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(csvRow(headerColumns) + '\r\n'));
        let cursor: RowCursor | null = null;
        for (;;) {
          const rows = await fetchPage(cursor);
          if (rows.length === 0) break;
          controller.enqueue(
            encoder.encode(rows.map((row) => csvRow(toColumns(row))).join('\r\n') + '\r\n')
          );
          if (rows.length < EXPORT_PAGE_SIZE) break;
          cursor = toRowCursor(rows[rows.length - 1]);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function exportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

exportRoutes.get('/links.csv', (c) => {
  return streamCsv<Link>(
    `linketry-links-${exportDate()}.csv`,
    [
      'id', 'slug', 'long_url', 'short_url', 'title', 'tags', 'status', 'clicks',
      'redirect_type', 'source', 'created_at', 'updated_at', 'last_clicked_at',
      'expires_at', 'max_clicks',
    ],
    (cursor) => getLinksPage(c.env, cursor, EXPORT_PAGE_SIZE),
    (l) => [
      l.id, l.slug, l.long_url, l.short_url ?? '', l.title ?? '', l.tags ?? '', l.status,
      l.clicks, l.redirect_type, l.source ?? '', l.created_at, l.updated_at,
      l.last_clicked_at ?? '', l.expires_at ?? '', l.max_clicks ?? '',
    ]
  );
});

exportRoutes.get('/links.json', (c) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('['));
        let cursor: RowCursor | null = null;
        let first = true;
        for (;;) {
          const rows = await getLinksPage(c.env, cursor, EXPORT_PAGE_SIZE);
          if (rows.length === 0) break;
          for (const link of rows) {
            controller.enqueue(encoder.encode((first ? '' : ',') + JSON.stringify(sanitizeLink(link))));
            first = false;
          }
          if (rows.length < EXPORT_PAGE_SIZE) break;
          cursor = toRowCursor(rows[rows.length - 1]);
        }
        controller.enqueue(encoder.encode(']'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="linketry-links-${exportDate()}.json"`,
    },
  });
});

exportRoutes.get('/visits.csv', async (c) => {
  const denied = await requireRawDumpAccess(c);
  if (denied) return denied;

  return streamCsv<Visit>(
    `linketry-visits-${exportDate()}.csv`,
    [
      'id', 'link_id', 'slug', 'domain', 'referer', 'country', 'user_agent',
      'browser', 'os', 'device_type', 'ip_hash', 'is_bot', 'created_at',
    ],
    (cursor) => getVisitsPage(c.env, cursor, EXPORT_PAGE_SIZE),
    (v) => [
      v.id, v.link_id, v.slug, v.domain, v.referer, v.country, v.user_agent,
      v.browser, v.os, v.device_type, v.ip_hash, v.is_bot, v.created_at,
    ]
  );
});

exportRoutes.get('/analytics.csv', async (c) => {
  const summary = await getAnalyticsSummary(
    c.env,
    parseAnalyticsFilters((key) => c.req.query(key))
  );
  return new Response(analyticsCsv(summary), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="linketry-analytics-${exportDate()}.csv"`,
    },
  });
});

exportRoutes.get('/backup.json', async (c) => {
  const denied = await requireRawDumpAccess(c);
  if (denied) return denied;

  return new Response(streamBackupJson(c.env), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="linketry-backup-${exportDate()}.json"`,
    },
  });
});

export default exportRoutes;
