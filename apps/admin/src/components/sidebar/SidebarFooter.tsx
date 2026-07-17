import React from 'react';
import { Eye, LogOut, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMode } from '../../contexts/AdminModeContext';
import { useLocale } from '../../contexts/LocaleContext';
import { SidebarUtilityActions } from './SidebarUtilityActions';
import { IS_PUBLIC_DEMO } from '../../config/demo';

export function SidebarFooter({ collapsed, compact }: { collapsed: boolean; compact: boolean }) {
  const { logout } = useAuth();
  const { isAdvanced, mode, setMode } = useAdminMode();
  const { t } = useLocale();

  return (
    <div
      className={clsx(
        'border-t border-slate-800',
        collapsed ? 'px-2 py-3' : 'px-3',
        compact ? 'py-2.5' : 'py-4'
      )}
    >
      <div className={clsx('mb-2', !collapsed && 'px-3')}>
        <SidebarUtilityActions collapsed={collapsed} />
      </div>
      <button
        type="button"
        onClick={() => setMode(isAdvanced ? 'simple' : 'advanced')}
        className={clsx(
          'mb-1 flex w-full items-center rounded-lg py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100',
          collapsed ? 'justify-center px-2' : 'justify-between px-3'
        )}
        aria-label={t('interfaceMode')}
        title={collapsed ? `${t('interfaceMode')}: ${t(mode)}` : undefined}
      >
        {collapsed ? (
          <SlidersHorizontal size={17} aria-hidden="true" />
        ) : (
          <>
            <span>{t('interfaceMode')}</span>
            <span className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase text-brand-400">
              {t(mode)}
            </span>
          </>
        )}
      </button>
      {IS_PUBLIC_DEMO ? (
        <div
          className={clsx(
            'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-amber-300',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          )}
          title={collapsed ? t('demoReadOnlyLabel') : undefined}
        >
          <Eye size={18} aria-hidden="true" />
          {!collapsed && t('demoReadOnlyLabel')}
        </div>
      ) : (
        <button
          type="button"
          onClick={logout}
          className={clsx(
            'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          )}
          aria-label={t('logout')}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut size={18} aria-hidden="true" />
          {!collapsed && t('logout')}
        </button>
      )}
    </div>
  );
}
