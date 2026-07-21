import React from 'react';
import type { AnalyticsSummary } from '../../api/analytics';
import { useLocale } from '../../contexts/LocaleContext';

const COLORS = [
  'rgb(52 211 153)',
  'rgb(96 165 250)',
  'rgb(251 191 36)',
  'rgb(34 211 238)',
  'rgb(244 114 182)',
];
const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AudienceComposition({ summary }: { summary: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const devices = summary?.topDevices ?? [];
  const browsers = summary?.topBrowsers ?? [];
  const deviceTotal = devices.reduce((total, item) => total + item.clicks, 0);
  const maxBrowser = Math.max(...browsers.map((item) => item.clicks), 1);
  let offset = 0;

  const deviceLabel = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === 'desktop' || normalized === 'mobile' || normalized === 'tablet') {
      return t(normalized);
    }
    if (normalized === 'bot') return t('botSeries');
    return value || t('unknown');
  };

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
      data-testid="audience-composition"
    >
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-100">{t('audienceComposition')}</h2>
      </div>
      <div className="grid lg:grid-cols-2">
        <div className="p-5">
          <h3 className="text-xs font-semibold uppercase text-slate-400">{t('deviceMix')}</h3>
          <div className="mt-4 grid items-center gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative mx-auto h-40 w-40">
              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
                role="img"
                aria-label={t('deviceMix')}
              >
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="rgb(30 41 59)"
                  strokeWidth="15"
                />
                {devices.map((item, index) => {
                  const length = deviceTotal > 0 ? (item.clicks / deviceTotal) * CIRCUMFERENCE : 0;
                  const dashOffset = -offset;
                  offset += length;
                  return (
                    <circle
                      key={item.device_type}
                      cx="60"
                      cy="60"
                      r={RADIUS}
                      fill="none"
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth="15"
                      strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                      strokeDashoffset={dashOffset}
                    >
                      <title>{`${deviceLabel(item.device_type)}: ${item.clicks.toLocaleString(locale)}`}</title>
                    </circle>
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-xl text-slate-100">
                  {deviceTotal.toLocaleString(locale)}
                </strong>
                <span className="text-[10px] text-slate-500">{t('clicksValue')}</span>
              </div>
            </div>
            <div className="space-y-3">
              {devices.length === 0 ? (
                <p className="text-sm text-slate-500">{t('noData')}</p>
              ) : (
                devices.slice(0, 5).map((item, index) => (
                  <div
                    key={item.device_type}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-slate-400">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{deviceLabel(item.device_type)}</span>
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {deviceTotal > 0 ? Math.round((item.clicks / deviceTotal) * 100) : 0}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 p-5 lg:border-l lg:border-t-0">
          <h3 className="text-xs font-semibold uppercase text-slate-400">{t('browserMix')}</h3>
          <div className="mt-5 space-y-4">
            {browsers.length === 0 ? (
              <p className="text-sm text-slate-500">{t('noData')}</p>
            ) : (
              browsers.slice(0, 6).map((item, index) => (
                <div key={item.browser}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-slate-400">{item.browser}</span>
                    <span className="shrink-0 text-slate-500">
                      {item.clicks.toLocaleString(locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (item.clicks / maxBrowser) * 100)}%`,
                        backgroundColor: COLORS[(index + 1) % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
