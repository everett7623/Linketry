import type {
  Link,
  VisitLinkSnapshot,
  VisitQueueMessage,
  VisitRequestSnapshot,
} from '@linketry/shared';
import type { Env } from '../types';
import { generateId, now, sha256 } from '../utils/id';
import {
  hasVisitedLinkOnDate,
  incrementClicks,
  insertVisit,
  upsertDailyStats,
} from '../db/index';
import { insertVisitTarget } from '../db/analytics';
import { isLikelyBot } from './botDetection';
import { isPublicReadOnlyDemo } from '../demo/policy';
import { createWebhookEmitter, emitWebhook, type WebhookEmitter } from '../webhooks/index';
import { buildClickWebhookData } from './clickWebhook';
import { detectBrowserLabel, detectDevice, detectOS } from '../utils/userAgent';

export async function recordVisit(
  env: Env,
  link: Link,
  request: Request,
  domain: string,
  target?: VisitQueueMessage['target']
): Promise<void> {
  if (isPublicReadOnlyDemo(env)) return;
  const message = createVisitQueueMessage(link, request, domain, target);
  await recordVisitMessage(env, message);
}

export async function queueOrRecordVisit(
  env: Env,
  link: Link,
  request: Request,
  domain: string,
  target?: VisitQueueMessage['target']
): Promise<void> {
  if (isPublicReadOnlyDemo(env)) return;
  const message = createVisitQueueMessage(link, request, domain, target);
  const needsImmediateClickAccounting = link.max_clicks !== null && link.max_clicks !== undefined;

  if (!env.VISITS_QUEUE || needsImmediateClickAccounting) {
    await recordVisitMessage(env, message);
    return;
  }

  try {
    await env.VISITS_QUEUE.send(message);
  } catch {
    await recordVisitMessage(env, message);
  }
}

export async function processVisitQueueBatch(
  env: Env,
  batch: MessageBatch<VisitQueueMessage>
): Promise<void> {
  if (isPublicReadOnlyDemo(env)) return;
  const emitClickWebhook = await createWebhookEmitter(env, 'link.clicked');
  await Promise.all(
    batch.messages.map((message) => recordVisitMessage(env, message.body, emitClickWebhook))
  );
}

export async function recordVisitMessage(
  env: Env,
  message: VisitQueueMessage,
  batchClickWebhook?: WebhookEmitter
): Promise<void> {
  if (isPublicReadOnlyDemo(env)) return;
  try {
    const { link, request, domain } = message;
    const ua = request.user_agent ?? '';
    const referer = request.referer ?? undefined;
    const country = request.country ?? undefined;
    const ip = request.ip ?? '';

    const isBot = isLikelyBot(ua) ? 1 : 0;
    const ipHash = ip ? await sha256(ip) : undefined;

    const visitId = generateId();
    const createdAt = now();
    const visitDate = createdAt.slice(0, 10);
    // Probed before the insert below so the row being written cannot mark itself a repeat.
    const isRepeatVisitor = await hasVisitedLinkOnDate(env, link.id, ipHash, visitDate);

    await Promise.all([
      incrementClicks(env, link.id, createdAt),
      insertVisit(env, {
        id: visitId,
        link_id: link.id,
        slug: link.slug,
        domain,
        referer,
        country,
        user_agent: ua,
        browser: detectBrowserLabel(ua),
        os: detectOS(ua),
        device_type: detectDevice(ua),
        ip_hash: ipHash,
        is_bot: isBot,
        created_at: createdAt,
      }),
      upsertDailyStats(env, link, visitDate, country, referer, createdAt, isRepeatVisitor),
    ]);

    if (message.target?.url) {
      try {
        await insertVisitTarget(env, {
          visit_id: visitId,
          link_id: link.id,
          slug: link.slug,
          domain,
          target_url: message.target.url,
          redirect_rule_id: message.target.redirect_rule_id ?? null,
          redirect_rule_type: message.target.redirect_rule_type ?? null,
          created_at: createdAt,
        });
      } catch {
        // Target analytics must never affect core visit accounting.
      }
    }

    // No KV write here: the redirect path already populated the cache from live D1
    // state. Rewriting it from this queued snapshot would resurrect entries that an
    // admin disabled or deleted in the meantime, and burn a KV write on every click.

    const clickData = buildClickWebhookData(message, visitId, createdAt, isBot === 1);
    if (batchClickWebhook) await batchClickWebhook(clickData);
    else await emitWebhook(env, 'link.clicked', clickData);
  } catch {
    // Statistics must never affect redirect
  }
}

function createVisitQueueMessage(
  link: Link,
  request: Request,
  domain: string,
  target?: VisitQueueMessage['target']
): VisitQueueMessage {
  return {
    link: {
      id: link.id,
      slug: link.slug,
      domain: link.domain ?? null,
      long_url: link.long_url,
      redirect_type: link.redirect_type,
      status: link.status,
      expires_at: link.expires_at ?? null,
      max_clicks: link.max_clicks ?? null,
      warning_enabled: link.warning_enabled,
      password_protected: !!link.password_hash,
    },
    request: snapshotRequest(request),
    domain,
    target,
    queued_at: now(),
  };
}

function snapshotRequest(request: Request): VisitRequestSnapshot {
  return {
    user_agent: request.headers.get('User-Agent') ?? null,
    referer: request.headers.get('Referer') ?? null,
    country: (request as Request & { cf?: { country?: string } }).cf?.country ?? null,
    ip: request.headers.get('CF-Connecting-IP') ?? null,
  };
}
