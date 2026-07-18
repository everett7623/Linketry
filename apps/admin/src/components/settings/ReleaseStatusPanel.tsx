import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { getOnlineUpgradeCapability, type OnlineUpgradeCapability } from '../../api/onlineUpgrade';
import { GITHUB_CHANGELOG_URL, GITHUB_UPGRADE_WORKFLOW_URL } from '../../api/updates';
import { useLocale } from '../../contexts/LocaleContext';
import { useUpdateCheckContext } from '../../contexts/UpdateCheckContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export function ReleaseStatusPanel() {
  const { locale, t } = useLocale();
  const { success, warning, error } = useToast();
  const updateCheck = useUpdateCheckContext();
  const [capability, setCapability] = useState<OnlineUpgradeCapability | null | undefined>();
  const [capabilityLoading, setCapabilityLoading] = useState(true);

  const refreshCapability = useCallback(async () => {
    setCapabilityLoading(true);
    try {
      const nextCapability = await getOnlineUpgradeCapability();
      setCapability(nextCapability);
      return nextCapability;
    } catch {
      setCapability(null);
      return null;
    } finally {
      setCapabilityLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCapability();
  }, [refreshCapability]);

  const handleRefresh = async () => {
    try {
      const [result] = await Promise.all([
        updateCheck.checkNow({ forceRefresh: true, revealDismissed: true }),
        refreshCapability(),
      ]);
      if (result.updateAvailable) {
        warning(t('updateAvailableTitle', { version: result.latestVersion }));
      } else {
        success(t('updateCheckCurrent', { version: result.currentVersion }));
      }
    } catch {
      error(t('updateCheckFailed'));
    }
  };

  const status = releaseStatus(updateCheck.result, updateCheck.checkError);
  const upgrade = upgradeStatus(capability, capabilityLoading);
  const checkedAt = updateCheck.result?.checkedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(updateCheck.result.checkedAt)
      )
    : t('unavailable');

  return (
    <section
      className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
      aria-labelledby="release-status-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="release-status-title" className="text-sm font-semibold text-slate-100">
            {t('releaseStatus')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{t('releaseStatusDescription')}</p>
        </div>
        <Badge variant={status.variant}>{t(status.label)}</Badge>
      </div>

      <dl className="divide-y divide-slate-800 border-y border-slate-800 text-sm">
        <StatusRow label={t('installedVersion')} value={`v${LINKETRY_VERSION}`} mono />
        <StatusRow
          label={t('latestGitHubVersion')}
          value={updateCheck.result ? `v${updateCheck.result.latestVersion}` : t('unavailable')}
          mono={Boolean(updateCheck.result)}
        />
        <StatusRow label={t('lastUpdateCheck')} value={checkedAt} />
        <StatusRow label={t('upgradeMethod')} value={t(upgrade.label)} />
      </dl>

      <div
        className={`flex gap-3 border-l-2 px-3 py-1 ${
          capability?.enabled
            ? 'border-emerald-500 text-emerald-200'
            : 'border-amber-500 text-amber-100'
        }`}
      >
        {capability?.enabled ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <p className="text-xs leading-5">
          {capability?.enabled
            ? t('oneClickUpgradeReadyDescription')
            : capability?.reason === 'not_configured'
              ? t('oneClickUpgradeSecretRequired')
              : capability?.reason === 'invalid_configuration'
                ? t('oneClickUpgradeInvalidDescription')
                : t('oneClickUpgradeUnavailableDescription')}
        </p>
      </div>

      {updateCheck.checkError && (
        <p className="text-xs text-red-300" role="alert">
          {t('updateCheckFailed')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={14} aria-hidden="true" />}
          loading={updateCheck.checking || capabilityLoading}
          onClick={() => void handleRefresh()}
        >
          {t('checkNow')}
        </Button>
        <ExternalAction href={updateCheck.result?.changelogUrl ?? GITHUB_CHANGELOG_URL}>
          {t('viewChanges')}
        </ExternalAction>
        <ExternalAction
          href={updateCheck.result?.upgradeWorkflowUrl ?? GITHUB_UPGRADE_WORKFLOW_URL}
        >
          {t('openDeployment')}
        </ExternalAction>
      </div>
    </section>
  );
}

function StatusRow({
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

function ExternalAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function releaseStatus(
  result: ReturnType<typeof useUpdateCheckContext>['result'],
  checkError: string | null
): {
  variant: 'green' | 'red' | 'yellow' | 'gray';
  label: 'upToDate' | 'updateAvailable' | 'updateStatusUnavailable' | 'checkingForUpdates';
} {
  if (result?.updateAvailable) return { variant: 'yellow', label: 'updateAvailable' };
  if (result) return { variant: 'green', label: 'upToDate' };
  if (checkError) return { variant: 'red', label: 'updateStatusUnavailable' };
  return { variant: 'gray', label: 'checkingForUpdates' };
}

function upgradeStatus(
  capability: OnlineUpgradeCapability | null | undefined,
  loading: boolean
): {
  label:
    | 'oneClickUpgradeReady'
    | 'manualDeploymentRequired'
    | 'upgradeConfigurationInvalid'
    | 'upgradeCapabilityUnavailable'
    | 'checkingUpgrade';
} {
  if (loading || capability === undefined) return { label: 'checkingUpgrade' };
  if (capability?.enabled) return { label: 'oneClickUpgradeReady' };
  if (capability?.reason === 'not_configured') return { label: 'manualDeploymentRequired' };
  if (capability?.reason === 'invalid_configuration') {
    return { label: 'upgradeConfigurationInvalid' };
  }
  return { label: 'upgradeCapabilityUnavailable' };
}
