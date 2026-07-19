import React from 'react';
import { BookOpen, Coins, MousePointerClick, Percent, Target } from 'lucide-react';
import type { AnalyticsSummary } from '../../api/analytics';
import { GITHUB_REPOSITORY_URL, GITHUB_UPDATE_BRANCH } from '../../api/updates';
import { useLocale } from '../../contexts/LocaleContext';

const branchPath = GITHUB_UPDATE_BRANCH.split('/').map(encodeURIComponent).join('/');
const analyticsGuideUrl = `${GITHUB_REPOSITORY_URL}/blob/${branchPath}/docs/ANALYTICS.md#conversion-events`;

export function ConversionInsights({ summary }: { summary?: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const available = summary?.conversionAttributionAvailable !== false;
  const conversionEvents = summary?.topConversionEvents ?? [];
  const conversionValues =
    summary?.conversionValues ?? deriveConversionValues(summary?.topConversionEvents ?? []);

  return (
    <section
      data-testid="conversion-insights"
      className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
      aria-labelledby="conversion-insights-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Target size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="conversion-insights-title" className="text-sm font-semibold text-slate-100">
              {t('conversionInsights')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{t('conversionInsightsHint')}</p>
          </div>
        </div>
        <a
          href={analyticsGuideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
        >
          <BookOpen size={14} aria-hidden="true" />
          {t('conversionIntegrationGuide')}
        </a>
      </div>

      {!available ? (
        <p className="m-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t('conversionFilterUnavailable')}
        </p>
      ) : (
        <>
          <div className="grid divide-y divide-slate-800 border-b border-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <ConversionMetric
              icon={<MousePointerClick size={16} aria-hidden="true" />}
              label={t('humanClicks')}
              value={(summary?.eligibleClicks ?? 0).toLocaleString(locale)}
            />
            <ConversionMetric
              icon={<Target size={16} aria-hidden="true" />}
              label={t('conversionEvents')}
              value={(summary?.conversionsTotal ?? 0).toLocaleString(locale)}
            />
            <ConversionMetric
              icon={<Percent size={16} aria-hidden="true" />}
              label={t('eventRate')}
              value={`${summary?.conversionRate ?? 0}%`}
            />
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
            <div className="min-w-0 p-5 lg:border-r lg:border-slate-800">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {t('eventsByGoal')}
              </h3>
              {conversionEvents.length === 0 ? (
                <p className="text-sm text-slate-500">{t('noConversionEvents')}</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {conversionEvents.map((event) => (
                    <div
                      key={`${event.event_name}-${event.currency ?? 'none'}`}
                      className="flex min-w-0 items-center justify-between gap-4 py-2.5 text-sm"
                    >
                      <span className="min-w-0 truncate font-mono text-slate-300">
                        {event.event_name}
                      </span>
                      <span className="shrink-0 text-right text-slate-400">
                        {t('eventsCount', { count: event.conversions })}
                        {event.value_total !== 0 && (
                          <span className="ml-2 text-emerald-400">
                            {formatConversionValue(event.value_total, event.currency, locale)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              data-testid="conversion-values"
              className="min-w-0 border-t border-slate-800 p-5 lg:border-t-0"
            >
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Coins size={14} aria-hidden="true" />
                {t('recordedValue')}
              </h3>
              {conversionValues.length === 0 ? (
                <p className="text-sm text-slate-500">{t('noRecordedValue')}</p>
              ) : (
                <div className="space-y-3">
                  {conversionValues.map((item) => (
                    <div
                      key={item.currency ?? 'unspecified'}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="text-xs text-slate-500">
                        {item.currency ?? t('unspecifiedCurrency')}
                      </span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {formatConversionValue(item.value_total, item.currency, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-4 text-slate-600">{t('eventRateHint')}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ConversionMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-4">
      <span className="text-emerald-400">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-slate-500">{label}</span>
        <span className="mt-0.5 block text-xl font-semibold text-slate-100">{value}</span>
      </span>
    </div>
  );
}

function formatConversionValue(value: number, currency: string | null, locale: string): string {
  if (!currency) return value.toLocaleString(locale, { maximumFractionDigits: 2 });
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;
  }
}

function deriveConversionValues(
  events: AnalyticsSummary['topConversionEvents']
): AnalyticsSummary['conversionValues'] {
  const values = new Map<string | null, { conversions: number; value_total: number }>();
  for (const event of events) {
    if (event.value_total === 0) continue;
    const current = values.get(event.currency) ?? { conversions: 0, value_total: 0 };
    current.conversions += event.conversions;
    current.value_total += event.value_total;
    values.set(event.currency, current);
  }
  return [...values.entries()].map(([currency, value]) => ({ currency, ...value }));
}
