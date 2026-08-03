import type { ReactNode } from 'react';
import { Check, Circle, ExternalLink, LoaderCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { useLocale } from '../contexts/LocaleContext';
import {
  useOnlineUpgradeContext,
  type OnlineUpgradeViewPhase,
} from '../contexts/OnlineUpgradeContext';
import { useUpdateCheckContext } from '../contexts/UpdateCheckContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const progressPhases = ['starting', 'queued', 'running', 'finalizing'] as const;

export function VersionCenterDialog() {
  const { locale, t } = useLocale();
  const updateCheck = useUpdateCheckContext();
  const upgrade = useOnlineUpgradeContext();
  const result = updateCheck.result;
  const checkedAt = result?.checkedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(result.checkedAt)
      )
    : t('unavailable');

  return (
    <Modal
      open={upgrade.centerOpen}
      onClose={upgrade.closeCenter}
      title={t('versionCenterTitle')}
      size="md"
    >
      <p className="text-sm leading-6 text-slate-400">{t('versionCenterDescription')}</p>

      <dl className="mt-5 divide-y divide-slate-800 border-y border-slate-800 text-sm">
        <VersionRow label={t('installedVersion')} value={`v${LINKETRY_VERSION}`} mono />
        <VersionRow
          label={t('latestGitHubVersion')}
          value={result ? `v${result.latestVersion}` : t('unavailable')}
          mono={Boolean(result)}
        />
        <VersionRow label={t('lastUpdateCheck')} value={checkedAt} />
      </dl>

      <div className="mt-5" aria-live="polite">
        <VersionCenterState />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          loading={updateCheck.checking || upgrade.capabilityLoading}
          disabled={upgrade.busy}
          onClick={() => upgrade.openCenter()}
        >
          {t('checkNow')}
        </Button>
        {result && <ExternalAction href={result.changelogUrl}>{t('viewChanges')}</ExternalAction>}
        {upgrade.runUrl && (
          <ExternalAction href={upgrade.runUrl}>{t('viewDeployment')}</ExternalAction>
        )}
      </div>
    </Modal>
  );
}

function VersionCenterState() {
  const { t } = useLocale();
  const upgrade = useOnlineUpgradeContext();
  const updateCheck = useUpdateCheckContext();

  if (upgrade.feedback && !upgrade.feedbackCompleted && upgrade.phase !== 'success') {
    return (
      <StateCallout
        tone="brand"
        title={t('upgradePropagationTitle', { version: upgrade.feedback.targetVersion })}
      >
        <p>
          {t(
            upgrade.feedbackAutoRefreshing
              ? 'upgradePropagationRefreshing'
              : 'upgradePropagationManual',
            { currentVersion: LINKETRY_VERSION }
          )}
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-4"
          icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={upgrade.reloadNow}
        >
          {t('refreshNow')}
        </Button>
      </StateCallout>
    );
  }

  if (upgrade.phase === 'confirming' && upgrade.availableUpdate) {
    return (
      <StateCallout tone="warning" title={t('confirmUpgradeTitle')}>
        <p>{t('confirmUpgradeMessage', { version: upgrade.availableUpdate.latestVersion })}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={upgrade.cancelConfirmation}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => void upgrade.confirmUpgrade()}
          >
            {t('confirmUpgrade')}
          </Button>
        </div>
      </StateCallout>
    );
  }

  if (isProgressPhase(upgrade.phase)) {
    return (
      <section aria-labelledby="upgrade-progress-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="upgrade-progress-title" className="text-sm font-semibold text-slate-100">
              {upgrade.phase === 'success' ? t('upgradeCompleteTitle') : t('upgradeProgressTitle')}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {t(phaseMessageKey(upgrade.phase))}
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500">
            v{upgrade.availableUpdate?.latestVersion}
          </span>
        </div>
        <UpgradeProgress phase={upgrade.phase} />
      </section>
    );
  }

  if (upgrade.phase === 'failed') {
    return (
      <StateCallout tone="danger" title={t('upgradeFailureTitle')}>
        <p>{upgrade.error ?? t('upgradeFailedGeneric')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {upgrade.automaticCapability?.enabled && (
            <Button
              type="button"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={upgrade.requestUpgrade}
            >
              {t('retryUpgrade')}
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={upgrade.resetFailure}>
            {t('dismissUpgradeResult')}
          </Button>
        </div>
      </StateCallout>
    );
  }

  if (updateCheck.checking && !updateCheck.result) {
    return (
      <StateCallout tone="neutral" title={t('checkingForUpdates')}>
        <p>{t('checkingUpgrade')}</p>
      </StateCallout>
    );
  }

  if (upgrade.availableUpdate) {
    return (
      <div className="space-y-4">
        <StateCallout
          tone="warning"
          title={t('updateAvailableTitle', { version: upgrade.availableUpdate.latestVersion })}
        >
          <p>
            {t(
              upgrade.automaticCapability?.enabled
                ? 'updateAvailableAutomaticDescription'
                : 'updateAvailableDescription',
              { currentVersion: upgrade.availableUpdate.currentVersion }
            )}
          </p>
        </StateCallout>
        {upgrade.automaticCapability?.enabled ? (
          <Button
            type="button"
            className="w-full"
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={upgrade.requestUpgrade}
          >
            {t('upgradeOnline')}
          </Button>
        ) : upgrade.capabilityLoading ? (
          <Button type="button" className="w-full" loading disabled>
            {t('checkingUpgrade')}
          </Button>
        ) : (
          <a
            href={upgrade.availableUpdate.upgradeWorkflowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('openDeployment')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    );
  }

  if (updateCheck.checkError) {
    return (
      <StateCallout tone="danger" title={t('updateStatusUnavailable')}>
        <p>{t('updateCheckFailed')}</p>
      </StateCallout>
    );
  }

  return (
    <StateCallout tone="success" title={t('upToDate')}>
      <p>{t('updateCheckCurrent', { version: LINKETRY_VERSION })}</p>
    </StateCallout>
  );
}

function UpgradeProgress({
  phase,
}: {
  phase: Exclude<OnlineUpgradeViewPhase, 'idle' | 'confirming' | 'failed'>;
}) {
  const { t } = useLocale();
  const currentIndex = phase === 'success' ? progressPhases.length : progressPhases.indexOf(phase);
  const steps = [
    t('upgradeStepPrepare'),
    t('upgradeStepQueue'),
    t('upgradeStepDeploy'),
    t('upgradeStepVerify'),
  ];

  return (
    <ol className="mt-5 space-y-0" aria-label={t('upgradeProgressTitle')}>
      {steps.map((label, index) => {
        const completed = index < currentIndex || phase === 'success';
        const active = index === currentIndex;
        return (
          <li key={label} className="relative min-h-12 pl-8">
            {index < steps.length - 1 && (
              <span
                className={`absolute left-[0.6875rem] top-5 h-[calc(100%-0.25rem)] border-l ${
                  completed ? 'border-emerald-500/60' : 'border-slate-700'
                }`}
                aria-hidden="true"
              />
            )}
            <span className="absolute left-0 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900">
              {completed ? (
                <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              ) : active ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-brand-300" aria-hidden="true" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              )}
            </span>
            <span
              className={`block text-sm ${
                completed
                  ? 'text-slate-300'
                  : active
                    ? 'font-medium text-slate-100'
                    : 'text-slate-500'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StateCallout({
  tone,
  title,
  children,
}: {
  tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  title: string;
  children: ReactNode;
}) {
  const toneClasses = {
    neutral: 'border-slate-600 text-slate-300',
    brand: 'border-brand-500 text-slate-300',
    success: 'border-emerald-500 text-emerald-100',
    warning: 'border-amber-500 text-amber-100',
    danger: 'border-red-500 text-red-100',
  } as const;

  return (
    <section className={`border-l-2 px-4 py-1 text-sm leading-6 ${toneClasses[tone]}`}>
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <div className="mt-1 text-xs leading-5 text-slate-400">{children}</div>
    </section>
  );
}

function VersionRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`break-words text-slate-200 sm:text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function ExternalAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function phaseMessageKey(phase: Exclude<OnlineUpgradeViewPhase, 'idle' | 'confirming' | 'failed'>) {
  const keys = {
    starting: 'upgradeStarting',
    queued: 'upgradeQueued',
    running: 'upgradeRunning',
    finalizing: 'upgradeFinalizing',
    success: 'upgradeSucceeded',
  } as const;
  return keys[phase];
}

function isProgressPhase(
  phase: OnlineUpgradeViewPhase
): phase is Exclude<OnlineUpgradeViewPhase, 'idle' | 'confirming' | 'failed'> {
  return ['starting', 'queued', 'running', 'finalizing', 'success'].includes(phase);
}
