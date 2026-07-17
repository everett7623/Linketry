import { Radio, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { useLocale } from '../../contexts/LocaleContext';
import {
  ANALYTICS_REFRESH_INTERVALS,
  type AnalyticsRefreshInterval,
} from '../../utils/analyticsRefresh';

interface AnalyticsRefreshControlProps {
  enabled: boolean;
  intervalSeconds: AnalyticsRefreshInterval;
  refreshing: boolean;
  lastUpdated: Date | null;
  onEnabledChange: (enabled: boolean) => void;
  onIntervalChange: (seconds: AnalyticsRefreshInterval) => void;
  onRefresh: () => void;
}

export function AnalyticsRefreshControl({
  enabled,
  intervalSeconds,
  refreshing,
  lastUpdated,
  onEnabledChange,
  onIntervalChange,
  onRefresh,
}: AnalyticsRefreshControlProps) {
  const { locale, t } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="accent-brand-500"
        />
        <Radio size={15} className={enabled ? 'text-emerald-400' : 'text-slate-500'} aria-hidden="true" />
        {t('autoRefresh')}
      </label>
      <Select
        aria-label={t('autoRefreshInterval')}
        value={String(intervalSeconds)}
        disabled={!enabled}
        onChange={(event) =>
          onIntervalChange(Number(event.target.value) as AnalyticsRefreshInterval)
        }
        className="h-9 w-20 py-1.5 text-xs"
      >
        {ANALYTICS_REFRESH_INTERVALS.map((seconds) => (
          <option key={seconds} value={seconds}>
            {seconds}s
          </option>
        ))}
      </Select>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        loading={refreshing}
        icon={<RefreshCw size={15} aria-hidden="true" />}
        aria-label={t('refreshAnalyticsNow')}
        title={t('refreshAnalyticsNow')}
        onClick={onRefresh}
        className="h-9 w-9 px-0"
      />
      <span className="min-w-28 text-right text-[11px] text-slate-500">
        {lastUpdated
          ? t('analyticsUpdatedAt', { time: lastUpdated.toLocaleTimeString(locale) })
          : t('analyticsWaitingForUpdate')}
      </span>
    </div>
  );
}
