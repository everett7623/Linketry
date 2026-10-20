import type { Env } from '../types';
import { insertAuditLog } from '../db/index';
import { generateId, now } from '../utils/id';
import { hashClientIp } from '../utils/ipHash';

export async function recordAudit(
  env: Env,
  request: Request,
  action: string,
  targetType?: string,
  targetId?: string,
  detail?: unknown
): Promise<void> {
  try {
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    const ipHash = ip ? await hashClientIp(env, ip) : null;
    const userAgent = request.headers.get('User-Agent');

    await insertAuditLog(env, {
      id: generateId(),
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      detail: detail === undefined ? null : JSON.stringify(detail),
      ip_hash: ipHash,
      user_agent: userAgent,
      created_at: now(),
    });
  } catch {
    // Audit logging should never block the admin action being recorded.
  }
}
