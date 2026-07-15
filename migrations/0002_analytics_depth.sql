-- Linketry V6 Analytics Depth

CREATE TABLE IF NOT EXISTS visit_targets (
  visit_id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  domain TEXT,
  target_url TEXT NOT NULL,
  redirect_rule_id TEXT,
  redirect_rule_type TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visit_targets_link_id ON visit_targets(link_id);
CREATE INDEX IF NOT EXISTS idx_visit_targets_slug ON visit_targets(slug);
CREATE INDEX IF NOT EXISTS idx_visit_targets_created_at ON visit_targets(created_at);
CREATE INDEX IF NOT EXISTS idx_visit_targets_rule ON visit_targets(redirect_rule_id, redirect_rule_type);

CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  domain TEXT,
  event_name TEXT NOT NULL,
  value REAL,
  currency TEXT,
  metadata TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_link_id ON conversion_events(link_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_slug ON conversion_events(slug);
CREATE INDEX IF NOT EXISTS idx_conversion_events_domain ON conversion_events(domain);
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name ON conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events(created_at);

INSERT OR IGNORE INTO settings (key, value, updated_at)
VALUES ('analytics_retention_days', '0', datetime('now'));
