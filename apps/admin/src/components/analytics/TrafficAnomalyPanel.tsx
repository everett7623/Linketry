import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, Play, Save } from 'lucide-react';
import {
  getTrafficAnomalyStatus,
  runTrafficAnomalyCheck,
  saveTrafficAnomalyConfig,
  type TrafficAnomalyConfig,
  type TrafficAnomalyKind,
  type TrafficAnomalyStatus,
} from '../../api/trafficAnomalies';
import { useLocale } from '../../contexts/LocaleContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

export function TrafficAnomalyPanel() {
  const { locale, t } = useLocale();
  const { success, error } = useToast();
  const [status, setStatus] = useState<TrafficAnomalyStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getTrafficAnomalyStatus()
      .then(setStatus)
      .catch(() => error(t('trafficAnomalyLoadFailed')));
  }, [error, t]);

  const setConfig = <K extends keyof TrafficAnomalyConfig>(
    key: K,
    value: TrafficAnomalyConfig[K]
  ) => {
    setStatus((current) =>
      current ? { ...current, config: { ...current.config, [key]: value } } : current
    );
  };

  const save = async () => {
    if (!status) return;
    setSaving(true);
    try {
      const config = await saveTrafficAnomalyConfig(status.config);
      setStatus((current) => (current ? { ...current, config } : current));
      success(t('trafficAnomalySaved'));
    } catch (cause) {
      error(String(cause));
    } finally {
      setSaving(false);
    }
  };

  const run = async () => {
    if (!status?.config.enabled) return;
    setChecking(true);
    try {
      const decision = await runTrafficAnomalyCheck();
      setStatus((current) => (current ? { ...current, state: decision.nextState } : current));
      success(t('trafficAnomalyChecked'));
    } catch (cause) {
      error(String(cause));
    } finally {
      setChecking(false);
    }
  };

  if (!status) {
    return (
      <section className="border border-slate-800 bg-slate-900 p-5">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </section>
    );
  }

  const { config, state } = status;
  const snapshot = state.snapshot;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="space-y-4 border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <BellRing size={16} />
            {t('trafficAnomalyAlerts')}
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">{t('trafficAnomalyHint')}</p>
        </div>
        {state.lastEvaluatedAt && (
          <span className="text-xs text-slate-500">
            {t('trafficAnomalyLastChecked', {
              date: dateFormatter.format(new Date(state.lastEvaluatedAt)),
            })}
          </span>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => setConfig('enabled', event.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
        />
        {t('enableTrafficAnomalyAlerts')}
      </label>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label={t('trafficMinimumVisits')}
          type="number"
          min="10"
          max="100000"
          value={config.minimumVisits}
          onChange={(event) => setConfig('minimumVisits', Number(event.target.value))}
        />
        <Input
          label={t('trafficVolumeMultiplier')}
          type="number"
          min="1.25"
          max="10"
          step="0.25"
          value={config.volumeMultiplier}
          onChange={(event) => setConfig('volumeMultiplier', Number(event.target.value))}
        />
        <Input
          label={t('trafficBotRateDelta')}
          type="number"
          min="5"
          max="100"
          step="1"
          value={config.botRateDeltaPercentagePoints}
          onChange={(event) =>
            setConfig('botRateDeltaPercentagePoints', Number(event.target.value))
          }
        />
        <Input
          label={t('trafficSuppressionMinutes')}
          type="number"
          min="0"
          max="10080"
          value={config.suppressionMinutes}
          onChange={(event) => setConfig('suppressionMinutes', Number(event.target.value))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button icon={<Save size={15} />} loading={saving} onClick={save}>
          {t('saveTrafficAnomalySettings')}
        </Button>
        <Button
          variant="secondary"
          icon={<Play size={15} />}
          loading={checking}
          disabled={!config.enabled || saving}
          onClick={run}
        >
          {t('runTrafficAnomalyCheck')}
        </Button>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('trafficAnomalyStatus')}
          </span>
          {!config.enabled ? (
            <Badge>{t('trafficAnomalyDisabled')}</Badge>
          ) : state.active.length > 0 ? (
            state.active.map((kind) => (
              <Badge key={kind} variant="red">
                {anomalyLabel(kind, t)}
              </Badge>
            ))
          ) : snapshot?.outcome === 'normal' ? (
            <Badge variant="green">{t('trafficWithinBaseline')}</Badge>
          ) : snapshot?.outcome === 'insufficient_data' ? (
            <Badge variant="yellow">{t('trafficInsufficientData')}</Badge>
          ) : (
            <Badge>{t('trafficNotEvaluated')}</Badge>
          )}
        </div>

        {snapshot && (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div className="border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">{t('trafficVisitEvidence')}</p>
              <p className="mt-1 font-semibold text-slate-200">
                {t('trafficCurrentVsBaseline', {
                  current: snapshot.currentVisits.toLocaleString(locale),
                  baseline: snapshot.baselineAverageVisits.toLocaleString(locale),
                  ratio: snapshot.volumeRatio.toLocaleString(locale),
                })}
              </p>
            </div>
            <div className="border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">{t('trafficBotEvidence')}</p>
              <p className="mt-1 font-semibold text-slate-200">
                {t('trafficBotCurrentVsBaseline', {
                  current: snapshot.currentBotRate.toLocaleString(locale),
                  baseline: snapshot.baselineBotRate.toLocaleString(locale),
                })}
              </p>
            </div>
          </div>
        )}

        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-400" />
          {t('trafficPrivacyNote')}
        </p>
      </div>
    </section>
  );
}

function anomalyLabel(
  kind: TrafficAnomalyKind,
  t: (key: 'trafficVolumeSpike' | 'trafficBotRateSpike') => string
): string {
  return t(kind === 'volume_spike' ? 'trafficVolumeSpike' : 'trafficBotRateSpike');
}
