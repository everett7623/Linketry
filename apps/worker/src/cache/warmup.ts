import type { Env } from '../types';
import { setCachedLink, deleteCachedLink } from '../cache';
import { getPopularLinksForWarmup, listDistinctLinkDomainSlugs } from '../db';

// D1 查询已移至 db/index.ts，遵守 CLAUDE.md：所有 D1 SQL 集中在 db/index.ts
// KV 操作通过 cache/index.ts 的函数完成，遵守 CLAUDE.md：所有 KV 读写在 cache/index.ts

const WARMUP_BATCH_SIZE = 50;
const CLEAR_PAGE_SIZE = 200;
const CLEAR_PARALLEL_SIZE = 50;

/**
 * 缓存预热：将热门链接加载到 KV
 * 在 Cron 任务中定期调用，使用 ctx.waitUntil() 包裹，不阻塞重定向。
 *
 * @returns 实际写入成功的链接数
 */
export async function warmupPopularLinks(env: Env): Promise<number> {
  try {
    const links = await getPopularLinksForWarmup(env);

    if (links.length === 0) return 0;

    let cached = 0;

    // 并行分批写入，每批 WARMUP_BATCH_SIZE 个
    for (let i = 0; i < links.length; i += WARMUP_BATCH_SIZE) {
      const batch = links.slice(i, i + WARMUP_BATCH_SIZE);

      const results = await Promise.all(
        batch.map(link =>
          // setCachedLink 返回 boolean：true=写入成功，false=已过期或 KV 错误
          setCachedLink(env, link.domain ?? '', {
            id: link.id,
            slug: link.slug,
            domain: link.domain,
            longUrl: link.long_url,
            redirectType: link.redirect_type as 301 | 302,
            status: link.status as 'active' | 'disabled' | 'expired' | 'archived',
            expiresAt: link.expires_at,
            maxClicks: link.max_clicks,
            warningEnabled: !!link.warning_enabled
          })
        )
      );

      // 只统计真正写入成功的条数
      cached += results.filter(Boolean).length;
    }

    console.log(`Warmed up ${cached}/${links.length} popular links`);
    return cached;
  } catch (err) {
    console.error('Cache warmup failed:', err);
    return 0;
  }
}

/**
 * 清理所有 Linketry KV 缓存键
 *
 * 谨慎使用：仅在需要完全重置缓存时调用（如迁移、测试）。
 * 使用游标分页避免一次性加载全量数据，并行批量删除提升效率。
 */
export async function clearAllCache(env: Env): Promise<void> {
  let cursor: string | null = null;
  let totalCleared = 0;

  try {
    while (true) {
      // 分页读取，避免一次性加载所有链接占满 Worker 内存
      const rows = await listDistinctLinkDomainSlugs(env, cursor, CLEAR_PAGE_SIZE);
      if (rows.length === 0) break;

      // 并行批量删除（通过 cache/index.ts 的 deleteCachedLink，保持 KV 操作集中）
      for (let i = 0; i < rows.length; i += CLEAR_PARALLEL_SIZE) {
        const batch = rows.slice(i, i + CLEAR_PARALLEL_SIZE);
        await Promise.all(
          batch.map(({ domain, slug }) => deleteCachedLink(env, domain ?? '', slug))
        );
        totalCleared += batch.length;
      }

      // 本页不足一页，已到末尾
      if (rows.length < CLEAR_PAGE_SIZE) break;

      // 推进游标到本页最后一条 slug
      cursor = rows[rows.length - 1].slug;
    }

    console.log(`Cleared cache for ${totalCleared} links`);
  } catch (err) {
    console.error('Cache clear failed:', err);
  }
}
