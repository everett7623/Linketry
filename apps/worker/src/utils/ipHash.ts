import type { Env } from '../types';
import { sha256 } from './id';

/**
 * 访客 IP 的存储哈希，用于 visits、conversion_events、audit_logs 的 ip_hash 列和 visits CSV 导出。
 *
 * IPv4 只有 2^32 种取值，无盐 SHA-256 可以离线穷举还原。配置 LINKETRY_IP_HASH_SECRET 后改用
 * HMAC-SHA256：只拿到 D1 数据、备份或导出文件的人无法还原 IP（Worker secret 无法通过 API 读回）。
 * 未配置时保持 SHA-256，与已有数据兼容。输出都是 64 位十六进制，表结构和查询无需改动。
 */
export async function hashClientIp(
  env: Pick<Env, 'LINKETRY_IP_HASH_SECRET'>,
  ip: string
): Promise<string> {
  const secret = env.LINKETRY_IP_HASH_SECRET?.trim();
  if (!secret) return sha256(ip);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
