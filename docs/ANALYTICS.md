# Analytics And Tracking

Linkora records redirect analytics asynchronously so a statistics failure never blocks a redirect.

## Dashboard Coverage

The Admin panel has two dashboard-style pages:

| Page | Purpose |
|------|---------|
| Overview | High-level dashboard with total links, total clicks, today's clicks, recently created links, and top links by clicks |
| Analytics | Filterable traffic dashboard for attribution, targets, UTM dimensions, and conversions |
| Link Analytics | Single-link detail page with daily trend, referrers, devices, redirect targets, and conversions |

## Tracked Visit Data

Each visit can store:

- Link ID and slug
- Short-link domain
- Referer
- Cloudflare country code
- User agent
- Detected browser
- Detected operating system
- Detected device type
- Hashed visitor IP
- Basic bot flag
- Timestamp

V6 also records the resolved redirect target in `visit_targets` when smart redirect or A/B rules are evaluated. The target record is written separately from the core visit write, so failures in target analytics do not affect click counts or redirects.

## Analytics Filters

`GET /api/analytics` and the Admin Analytics page support:

- `days`
- `link_id`
- `slug`
- `domain`
- `tag`
- `campaign`
- `project`
- `country`
- `device`
- `browser`
- `referer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

Campaign and project filters map to managed group tags, for example `campaign:launch` and `project:website`.

## Dashboard Metrics

The Analytics page currently shows:

- Total clicks
- Approximate unique visitors based on distinct hashed IPs
- Unique clicked links
- Bot clicks and bot rate
- Conversion count and conversion rate
- Daily click trend
- Top links
- Top countries
- Top referrers
- Top browsers
- Top devices
- Top operating systems
- Top UTM source, medium, campaign, term, and content values
- Redirect target / A-B target breakdown
- Conversion event breakdown
- Recent visits

Analytics summary reports can be exported from `GET /api/export/analytics.csv`. Raw visits can still be exported from `GET /api/export/visits.csv`.

## Conversion Events

Authenticated API clients can record conversion or goal events:

```http
POST /api/conversions
Authorization: Bearer <token-with-write-scope>
Content-Type: application/json
```

```json
{
  "link_id": "link-id",
  "event_name": "signup",
  "value": 29,
  "currency": "USD",
  "metadata": { "plan": "starter" }
}
```

`event_name` is limited to letters, numbers, dot, underscore, colon, and dash. Metadata is stored as a bounded JSON string.

## Retention

The `analytics_retention_days` setting controls cleanup of old raw analytics rows during the scheduled Worker cron run:

- `0` keeps analytics indefinitely
- `1` to `3650` deletes older visits, daily stats, redirect target records, and conversion events

Retention cleanup runs separately from scheduled backups. Cleanup failures are logged but do not block backups or redirects.

## Privacy Notes

Linkora stores a hash of the visitor IP rather than the raw IP address. The unique visitor count is approximate because it is based on distinct hashed IPs in the selected date range.

## Future Analytics Ideas

- Better bot classification
- Public read-only stats pages
- More conversion attribution fields, such as client-provided visitor/session IDs
