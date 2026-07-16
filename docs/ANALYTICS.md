# Analytics And Tracking

Linketry records redirect analytics asynchronously so a statistics failure never blocks a redirect.

## Dashboard Coverage

The Admin panel has two dashboard-style pages:

| Page           | Purpose                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Overview       | High-level dashboard with total links, total clicks, today's clicks, recently created links, and top links by clicks |
| Analytics      | Filterable traffic dashboard for attribution, targets, UTM dimensions, and conversions                               |
| Link Analytics | Single-link detail page with daily trend, referrers, devices, redirect targets, and conversions                      |

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

`GET /api/v1/analytics` and the Admin Analytics page support:

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

Analytics summary reports can be exported from `GET /api/v1/export/analytics.csv`. Raw visits can still be exported from `GET /api/v1/export/visits.csv`.

## Conversion Events

Authenticated API clients can record conversion or goal events:

```http
POST /api/v1/conversions
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

## Traffic Anomaly Alerts

Traffic anomaly alerts are opt-in under **Analytics → Traffic Anomaly Alerts**. The daily Cron compares two bounded aggregate windows:

- Current window: the latest 24 hours
- Baseline window: the preceding 7 complete 24-hour periods, represented as a daily average

The detector currently covers:

- Visit volume at or above the configured baseline multiplier
- Bot rate at or above the configured percentage-point increase

Both windows must meet the configured minimum daily visit count before either signal is eligible. Operators can configure the minimum visits, volume multiplier, bot-rate increase, and repeat-suppression period. An authenticated **Check now** action uses the same policy and can send notifications when the feature is enabled.

Active signals, the most recent aggregate snapshot, and alert/recovery timestamps are stored in D1 settings. Alerts and recoveries use the existing configured notification channels. A delivery failure is logged and does not affect redirects or visit ingestion.

## Privacy Notes

Linketry stores a hash of the visitor IP rather than the raw IP address. The unique visitor count is approximate because it is based on distinct hashed IPs in the selected date range.

Public read-only statistics are implemented with per-link opt-in, hashed share tokens, bounded date ranges, optional country/referrer disclosure, noindex/nofollow responses, and private no-store caching. Public sharing is disabled by default.

Traffic anomaly detection stores only aggregate visit counts, bot counts, rates, windows, and alert state. It does not add or persist new visitor, IP, session, referrer, or country identifiers.

## Future Analytics Ideas

- Privacy-safe session or visitor-level conversion attribution
- More conversion attribution fields, such as external campaign IDs and client-provided visitor IDs
- Additional bounded anomaly dimensions, such as aggregate referrer or country shifts, only after a minimum-volume privacy contract is defined

Any additional traffic anomaly detection must keep using bounded scheduled or post-processing work. It must not add synchronous queries, target probes, or notification delivery to the redirect path.
