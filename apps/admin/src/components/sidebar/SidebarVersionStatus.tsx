import { CircleAlert, CircleArrowUp, RefreshCw, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { LINKETRY_VERSION } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { useOnlineUpgradeContext } from '../../contexts/OnlineUpgradeContext';
import { useUpdateCheckContext } from '../../contexts/UpdateCheckContext';

export function SidebarVersionStatus({ collapsed }: { collapsed: boolean }) {
  const { t } = useLocale();
  const updateCheck = useUpdateCheckContext();
  const upgrade = useOnlineUpgradeContext();
  const latestVersion = updateCheck.result?.updateAvailable
    ? updateCheck.result.latestVersion
    : null;
  const accessibleLabel = updateCheck.checking
    ? t('checkingForUpdates')
    : upgrade.busy
      ? t('sidebarUpgradeInProgress')
      : upgrade.phase === 'failed'
        ? t('sidebarUpgradeFailed')
        : latestVersion
          ? t('updateAvailableTitle', { version: latestVersion })
          : t('checkForUpdates');

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="sidebar-version"
        onClick={upgrade.centerOpen ? upgrade.closeCenter : upgrade.openCenter}
        disabled={updateCheck.checking && !upgrade.centerOpen}
        className={clsx(
          'relative flex w-full items-center rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait',
          collapsed ? 'h-9 justify-center px-1' : 'min-h-10 gap-2.5 px-2.5 py-1.5',
          upgrade.phase === 'failed'
            ? 'border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15'
            : latestVersion || upgrade.busy
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/15'
              : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100'
        )}
        aria-label={accessibleLabel}
        aria-expanded={upgrade.centerOpen}
        aria-haspopup="dialog"
        title={accessibleLabel}
      >
        <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
          {updateCheck.checking || upgrade.busy ? (
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : upgrade.phase === 'failed' ? (
            <CircleAlert className="h-[17px] w-[17px]" aria-hidden="true" />
          ) : latestVersion ? (
            <CircleArrowUp className="h-[17px] w-[17px]" aria-hidden="true" />
          ) : (
            <Tag className="h-4 w-4" aria-hidden="true" />
          )}
          {(latestVersion || upgrade.phase === 'failed') && (
            <span
              className={clsx(
                'absolute right-0 top-0 h-2 w-2 rounded-full ring-2 ring-slate-900',
                upgrade.phase === 'failed' ? 'bg-red-400' : 'bg-amber-400'
              )}
            />
          )}
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-mono text-xs font-semibold leading-4 text-slate-200">
              v{LINKETRY_VERSION}
            </span>
            <span
              className={clsx(
                'truncate text-[10px] leading-4',
                latestVersion ? 'text-amber-300' : 'text-slate-500'
              )}
            >
              {updateCheck.checking
                ? t('checkingForUpdates')
                : upgrade.busy
                  ? t('sidebarUpgradeInProgress')
                  : upgrade.phase === 'failed'
                    ? t('sidebarUpgradeFailed')
                    : latestVersion
                      ? t('sidebarUpdateAvailable', { version: latestVersion })
                      : updateCheck.checkError
                        ? t('updateStatusUnavailable')
                        : t('upToDate')}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
