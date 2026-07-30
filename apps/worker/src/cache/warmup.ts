import type { Env } from '../types';
import { setCachedLink } from '../cache';

/**
 * 缓存预热：将热门链接加载到 KV
 * 在 Cron 任务中定期调用
 */
export async function warmupPopularLinks(env: Env): Promise<number> {
  try {
    // 查询热门活跃链接
    const result = await env.DB.prepare(`
      SELECT
        domain, slug, long_url, redirect_type, status,
        expires_at, max_clicks, clicks, password_hash,
        warning_enabled
      FROM links
      WHERE status = 'active'
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        AND (max_clicks IS NULL OR clicks < max_clicks)
        AND clicks > 50
      ORDER BY clicks DESC
      LIMIT 1000
    `).all();

    if (!result.results || result.results.length === 0) {
      return 0;
    }

    // 批量缓存，每批 50 个
    const batchSize = 50;
    let cached = 0;

    for (let i = 0; i < result.results.length; i += batchSize) {
      const batch = result.results.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (link: any) => {
          try {
            await setCachedLink(env, link.domain, {
              slug: link.slug,
              long_url: link.long_url,
              redirect_type: link.redirect_type as 301 | 302,
              status: link.status,
              expires_at: link.expires_at,
              max_clicks: link.max_clicks,
              click_count: link.clicks,
              password_hash: link.password_hash,
              warning_enabled: link.warning_enabled
            });
            cached++;
          } catch (err) {
            console.error(`Failed to cache ${link.domain}/${link.slug}:`, err);
          }
        })
      );
    }

    console.log(`Warmed up ${cached} popular links`);
    return cached;
  } catch (err) {
    console.error('Cache warmup failed:', err);
    return 0;
  }
}

/**
 * 清理所有 Linketry 缓存键
 * 谨慎使用：仅在需要完全重置缓存时调用
 */
export async function clearAllCache(env: Env): Promise<void> {
  try {
    // KV 不支持前缀删除，只能逐个删除
    // 这里我们通过查询所有活跃链接来删除对应的缓存
    const result = await env.DB.prepare(`
      SELECT DISTINCT domain, slug FROM links
    `).all();

    if (!result.results) return;

    for (const link of result.results as any[]) {
      const key = `linketry:slug:${link.domain}:${link.slug}`;
      await env.KV.delete(key);
    }

    console.log(`Cleared cache for ${result.results.length} links`);
  } catch (err) {
    console.error('Cache clear failed:', err);
  }
}
