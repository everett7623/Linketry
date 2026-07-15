import type { Env } from '../types';

export interface BulkUtmUpdate {
  id: string;
  currentUrl: string;
  nextUrl: string;
}

export async function updateBulkUtmLinks(
  env: Env,
  updates: BulkUtmUpdate[],
  updatedAt: string
): Promise<BulkUtmUpdate[]> {
  if (updates.length === 0) return [];
  const statements = updates.map((item) => env.DB.prepare(
    'UPDATE links SET long_url = ?, updated_at = ? WHERE id = ? AND long_url = ?'
  ).bind(item.nextUrl, updatedAt, item.id, item.currentUrl));
  const results = await env.DB.batch(statements);
  return updates.filter((_, index) => (results[index]?.meta.changes ?? 0) === 1);
}
