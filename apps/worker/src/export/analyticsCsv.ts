import type { AnalyticsSummary } from '../db/analytics';

export function analyticsCsv(summary: AnalyticsSummary): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ['section', 'label', 'value', 'extra'],
    ['summary', 'days', summary.days, ''],
    ['summary', 'total_clicks', summary.totalClicks, ''],
    ['summary', 'unique_visitors', summary.uniqueVisitors, ''],
    ['summary', 'unique_links', summary.uniqueLinks, ''],
    ['summary', 'bot_clicks', summary.botClicks, ''],
    ['summary', 'eligible_human_clicks', summary.eligibleClicks, ''],
    ['summary', 'conversions_total', summary.conversionsTotal, ''],
    ['summary', 'conversion_rate_percent', summary.conversionRate, ''],
    [
      'summary',
      'conversion_attribution_available',
      String(summary.conversionAttributionAvailable),
      '',
    ],
  ];

  for (const item of summary.daily) rows.push(['daily', item.date, item.clicks, 'clicks']);
  for (const item of summary.topLinks)
    rows.push(['top_links', item.slug, item.clicks, item.title ?? item.domain ?? '']);
  for (const item of summary.topCountries)
    rows.push(['top_countries', item.country, item.clicks, 'clicks']);
  for (const item of summary.topReferrers)
    rows.push(['top_referrers', item.referer, item.clicks, 'clicks']);
  for (const item of summary.topBrowsers)
    rows.push(['top_browsers', item.browser, item.clicks, 'clicks']);
  for (const item of summary.topDevices)
    rows.push(['top_devices', item.device_type, item.clicks, 'clicks']);
  for (const item of summary.topOperatingSystems)
    rows.push(['top_operating_systems', item.os, item.clicks, 'clicks']);
  for (const item of summary.topUtmSources)
    rows.push(['utm_source', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmMediums)
    rows.push(['utm_medium', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmCampaigns)
    rows.push(['utm_campaign', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmTerms)
    rows.push(['utm_term', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmContents)
    rows.push(['utm_content', item.value, item.clicks, 'clicks']);
  for (const item of summary.topTargets)
    rows.push([
      'redirect_targets',
      item.target_url,
      item.clicks,
      item.redirect_rule_type ?? 'default',
    ]);
  for (const item of summary.topConversionEvents) {
    rows.push([
      'conversion_events',
      item.event_name,
      item.conversions,
      item.currency ? `${item.currency}:${item.value_total}` : item.value_total,
    ]);
  }
  for (const item of summary.conversionValues) {
    rows.push([
      'conversion_values',
      item.currency ?? 'unspecified',
      item.value_total,
      `${item.conversions} events`,
    ]);
  }

  return rows.map((row) => row.map(csv).join(',')).join('\r\n');
}

function csv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
