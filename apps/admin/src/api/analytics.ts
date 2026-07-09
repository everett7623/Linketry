import { apiGet, apiPost, downloadFile } from './client';
import type { ConversionEvent, Link, Visit } from '@linkora/shared';

export interface AnalyticsFilters {
  days?: number;
  link_id?: string;
  slug?: string;
  domain?: string;
  tag?: string;
  campaign?: string;
  project?: string;
  country?: string;
  device?: string;
  browser?: string;
  referer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface AnalyticsSummary {
  days: number;
  totalClicks: number;
  botClicks: number;
  uniqueVisitors: number;
  uniqueLinks: number;
  conversionsTotal: number;
  conversionRate: number;
  daily: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ id?: string | null; slug: string; domain?: string | null; title?: string | null; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referer: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  topDevices: Array<{ device_type: string; clicks: number }>;
  topOperatingSystems: Array<{ os: string; clicks: number }>;
  topUtmSources: Array<{ value: string; clicks: number }>;
  topUtmMediums: Array<{ value: string; clicks: number }>;
  topUtmCampaigns: Array<{ value: string; clicks: number }>;
  topUtmTerms: Array<{ value: string; clicks: number }>;
  topUtmContents: Array<{ value: string; clicks: number }>;
  topTargets: Array<{ target_url: string; redirect_rule_id?: string | null; redirect_rule_type?: string | null; clicks: number }>;
  topConversionEvents: Array<{ event_name: string; conversions: number; value_total: number }>;
  recentVisits: Visit[];
}

export interface LinkAnalyticsResponse {
  link: Link;
  summary: AnalyticsSummary;
}

export interface ConversionPayload {
  link_id?: string;
  slug?: string;
  domain?: string;
  event_name: string;
  value?: number | null;
  currency?: string | null;
  metadata?: unknown;
}

export function getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
  const q = analyticsQuery(filters);
  return apiGet(`/api/analytics?${q.toString()}`);
}

export function getLinkAnalytics(id: string, filters: AnalyticsFilters = {}): Promise<LinkAnalyticsResponse> {
  const q = analyticsQuery(filters);
  return apiGet(`/api/analytics/links/${id}?${q.toString()}`);
}

export function createConversion(payload: ConversionPayload): Promise<ConversionEvent> {
  return apiPost('/api/conversions', payload);
}

export function downloadAnalyticsReport(filters: AnalyticsFilters = {}): Promise<void> {
  const q = analyticsQuery(filters);
  const suffix = new Date().toISOString().slice(0, 10);
  return downloadFile(`/api/export/analytics.csv?${q.toString()}`, `linkora-analytics-${suffix}.csv`);
}

function analyticsQuery(filters: AnalyticsFilters): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      q.set(key, String(value));
    }
  }
  if (!q.has('days')) q.set('days', '30');
  return q;
}
