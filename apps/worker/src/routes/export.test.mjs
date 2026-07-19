import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsCsv } from '../export/analyticsCsv.ts';

test('analytics CSV keeps the human-click basis and currency-separated conversion value', () => {
  const csv = analyticsCsv({
    days: 30,
    totalClicks: 84,
    botClicks: 4,
    uniqueVisitors: 27,
    uniqueLinks: 5,
    eligibleClicks: 80,
    conversionsTotal: 4,
    conversionRate: 5,
    conversionAttributionAvailable: true,
    daily: [],
    topLinks: [],
    topCountries: [],
    topReferrers: [],
    topBrowsers: [],
    topDevices: [],
    topOperatingSystems: [],
    topUtmSources: [],
    topUtmMediums: [],
    topUtmCampaigns: [],
    topUtmTerms: [],
    topUtmContents: [],
    topTargets: [],
    topConversionEvents: [
      { event_name: 'signup', currency: 'USD', conversions: 4, value_total: 54 },
    ],
    conversionValues: [{ currency: 'USD', conversions: 4, value_total: 54 }],
    recentVisits: [],
  });

  assert.match(csv, /summary,eligible_human_clicks,80,/);
  assert.match(csv, /conversion_events,signup,4,USD:54/);
  assert.match(csv, /conversion_values,USD,54,4 events/);
});
