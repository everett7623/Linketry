import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Bot, Download, Edit3, Link2, MousePointerClick, Target, Users } from 'lucide-react';
import { downloadAnalyticsReport, getLinkAnalytics, type LinkAnalyticsResponse } from '../api/analytics';
import { BarList, DailyBars, Metric, RecentVisits } from '../components/analytics/AnalyticsBlocks';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export function LinkAnalytics() {
  const { id = '' } = useParams();
  const { success, error } = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<LinkAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getLinkAnalytics(id, { days })
      .then(setData)
      .catch(() => error('Failed to load link analytics'))
      .finally(() => setLoading(false));
  }, [id, days]);

  const exportReport = async () => {
    setDownloading(true);
    try {
      await downloadAnalyticsReport({ days, link_id: id });
      success('Link report downloaded');
    } catch {
      error('Failed to download link report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const summary = data?.summary;
  const link = data?.link;
  const botRate = summary?.totalClicks ? Math.round(((summary.botClicks ?? 0) / summary.totalClicks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <RouterLink to="/analytics" className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
            <ArrowLeft size={15} />
            Analytics
          </RouterLink>
          <h1 className="text-2xl font-bold text-slate-100">/{link?.slug ?? 'link'}</h1>
          <p className="mt-0.5 max-w-3xl truncate text-sm text-slate-400">{link?.long_url}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 365 days</option>
          </Select>
          <Button variant="secondary" icon={<Download size={15} />} loading={downloading} onClick={exportReport}>
            Export CSV
          </Button>
          {link && (
            <RouterLink to={`/links/${link.id}/edit`}>
              <Button icon={<Edit3 size={15} />}>Edit Link</Button>
            </RouterLink>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Clicks" value={summary?.totalClicks ?? 0} icon={<MousePointerClick size={16} />} />
        <Metric label="Unique Visitors" value={summary?.uniqueVisitors ?? 0} icon={<Users size={16} />} />
        <Metric label="Conversions" value={summary?.conversionsTotal ?? 0} icon={<Target size={16} />} />
        <Metric label="Conversion Rate" value={`${summary?.conversionRate ?? 0}%`} icon={<Activity size={16} />} />
        <Metric label="Bot Rate" value={`${botRate}%`} icon={<Bot size={16} />} />
        <Metric label="Status" value={link?.status ?? 'unknown'} icon={<Link2 size={16} />} />
      </div>

      <DailyBars items={summary?.daily ?? []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList title="Redirect Targets" items={(summary?.topTargets ?? []).map((item) => ({ label: item.target_url, value: item.clicks }))} />
        <BarList title="Conversion Events" valueLabel="events" items={(summary?.topConversionEvents ?? []).map((item) => ({ label: item.event_name, value: item.conversions }))} />
        <BarList title="Referrers" items={(summary?.topReferrers ?? []).map((item) => ({ label: item.referer, value: item.clicks }))} />
        <BarList title="Countries" items={(summary?.topCountries ?? []).map((item) => ({ label: item.country, value: item.clicks }))} />
        <BarList title="Devices" items={(summary?.topDevices ?? []).map((item) => ({ label: item.device_type, value: item.clicks }))} />
        <BarList title="Browsers" items={(summary?.topBrowsers ?? []).map((item) => ({ label: item.browser, value: item.clicks }))} />
        <BarList title="UTM Sources" items={(summary?.topUtmSources ?? []).map((item) => ({ label: item.value, value: item.clicks }))} />
        <BarList title="UTM Mediums" items={(summary?.topUtmMediums ?? []).map((item) => ({ label: item.value, value: item.clicks }))} />
        <BarList title="UTM Campaigns" items={(summary?.topUtmCampaigns ?? []).map((item) => ({ label: item.value, value: item.clicks }))} />
        <BarList title="UTM Terms" items={(summary?.topUtmTerms ?? []).map((item) => ({ label: item.value, value: item.clicks }))} />
        <BarList title="UTM Contents" items={(summary?.topUtmContents ?? []).map((item) => ({ label: item.value, value: item.clicks }))} />
      </div>

      <RecentVisits visits={summary?.recentVisits ?? []} />
    </div>
  );
}
