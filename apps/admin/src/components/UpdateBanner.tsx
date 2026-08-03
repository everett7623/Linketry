import { ExternalLink, RefreshCw, X } from 'lucide-react';
import type { UpdateCheckResult } from '../api/updates';
import { useLocale } from '../contexts/LocaleContext';
import { useOnlineUpgradeContext } from '../contexts/OnlineUpgradeContext';
import { UpgradeRefreshNotice } from './UpgradeRefreshNotice.tsx';

export function UpdateBanner({
  update,
  onDismiss,
}: {
  update: UpdateCheckResult | null;
  onDismiss: () => void;
}) {
  const { t } = useLocale();
  const upgrade = useOnlineUpgradeContext();

  if (upgrade.feedback && !upgrade.feedbackCompleted) {
    return (
      <UpgradeRefreshNotice
        targetVersion={upgrade.feedback.targetVersion}
        autoRefreshing={upgrade.feedbackAutoRefreshing}
        onDismiss={upgrade.dismissFeedback}
        onReload={upgrade.reloadNow}
      />
    );
  }

  if (!update) return null;

  const active = upgrade.busy || upgrade.phase === 'confirming';
  const progressMessage =
    upgrade.phase === 'failed'
      ? upgrade.error
      : upgrade.phase === 'confirming'
        ? t('confirmUpgradeTitle')
        : upgrade.phase !== 'idle'
          ? t(phaseMessageKey(upgrade.phase))
          : null;

  return (
    <div
      className="mx-auto mt-4 w-full max-w-[1600px] px-4 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col gap-3 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 pr-10 text-sm text-slate-200 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">
            {t('updateAvailableTitle', { version: update.latestVersion })}
          </p>
          <p className="mt-0.5 text-slate-400">
            {progressMessage ??
              t(
                upgrade.automaticCapability?.enabled
                  ? 'updateAvailableAutomaticDescription'
                  : 'updateAvailableDescription',
                { currentVersion: update.currentVersion }
              )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <a
            href={update.changelogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            {t('viewChanges')}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <button
            type="button"
            data-testid="open-version-center"
            onClick={upgrade.openCenter}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1 font-medium text-white hover:bg-brand-500"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${upgrade.busy ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {active ? t('viewUpgradeProgress') : t('viewUpdateDetails')}
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('dismissUpdate')}
          title={t('dismissUpdate')}
          disabled={active}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function phaseMessageKey(
  phase: Exclude<
    ReturnType<typeof useOnlineUpgradeContext>['phase'],
    'idle' | 'confirming' | 'failed'
  >
) {
  const keys = {
    starting: 'upgradeStarting',
    queued: 'upgradeQueued',
    running: 'upgradeRunning',
    finalizing: 'upgradeFinalizing',
    success: 'upgradeSucceeded',
  } as const;
  return keys[phase];
}
