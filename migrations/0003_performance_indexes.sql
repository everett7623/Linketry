-- Performance optimization indexes
-- Created: 2026-07-30
-- Purpose: Improve query performance for common operations

-- 1. 主查询优化：domain + slug 复合索引
-- 用于重定向查询（最关键）
CREATE INDEX IF NOT EXISTS idx_links_domain_slug
ON links(domain, slug)
WHERE status = 'active';

-- 2. 热门链接查询优化
-- 用于缓存预热和分析
CREATE INDEX IF NOT EXISTS idx_links_click_count
ON links(click_count DESC)
WHERE status = 'active';

-- 3. 访问统计查询优化
-- 用于单链接分析和时间范围查询
CREATE INDEX IF NOT EXISTS idx_visits_link_timestamp
ON visits(link_id, timestamp DESC);

-- 4. 多维度分析优化
-- 用于按国家、设备等维度的分析查询
CREATE INDEX IF NOT EXISTS idx_visits_country_device
ON visits(link_id, country, device, timestamp DESC);

-- 5. 时间范围分析优化
-- 用于 Analytics 仪表板的时间范围过滤
CREATE INDEX IF NOT EXISTS idx_visits_timestamp_link
ON visits(timestamp DESC, link_id);

-- 6. 域名管理优化
-- 用于按域名列出链接
CREATE INDEX IF NOT EXISTS idx_links_domain_created
ON links(domain, created_at DESC);

-- 7. 标签查询优化（如果使用 JSON 存储标签）
-- 用于按标签过滤链接
CREATE INDEX IF NOT EXISTS idx_links_tags
ON links(tags)
WHERE tags IS NOT NULL;

-- 8. 过期链接清理优化
-- 用于 Cron 任务清理过期链接
CREATE INDEX IF NOT EXISTS idx_links_expires_at
ON links(expires_at)
WHERE expires_at IS NOT NULL
AND status = 'active';

-- 9. 审计日志查询优化
-- 用于审计日志页面的时间范围查询
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
ON audit_logs(timestamp DESC);

-- 10. 导入任务状态查询优化
-- 用于导入任务列表和状态轮询
CREATE INDEX IF NOT EXISTS idx_import_jobs_status_created
ON import_jobs(status, created_at DESC);
