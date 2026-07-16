import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAdminMode } from '../contexts/AdminModeContext';
import { isFeatureVisible } from '../utils/adminMode';
import { useLocale } from '../contexts/LocaleContext';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { NAV_GROUPS } from './sidebar/sidebarNavigation';

export function Sidebar() {
  const { mode } = useAdminMode();
  const { sidebarDensity, loadingVisibility, moduleIsVisible } = useDisplayPreferences();
  const { t } = useLocale();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => isFeatureVisible(mode, item.advanced) && moduleIsVisible(item.module)
    ),
  })).filter((group) => group.items.length > 0);
  const compact = sidebarDensity === 'compact';

  return (
    <aside
      className={clsx(
        'flex h-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-[width]',
        compact ? 'w-52' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center gap-2.5 border-b border-slate-800',
          compact ? 'px-4 py-3.5' : 'px-5 py-5'
        )}
      >
        <div
          className="relative h-7 w-11 shrink-0 overflow-hidden rounded-md bg-white"
          aria-hidden="true"
        >
          <img
            src="/linketry-logo.png"
            alt=""
            className="absolute -left-3 -top-[53px] w-[132px] max-w-none"
          />
        </div>
        <span className="font-bold text-lg text-slate-100 tracking-tight">Linketry</span>
      </div>

      {/* Nav */}
      <nav
        className={clsx(
          'scrollbar-thin flex-1 overflow-y-auto',
          compact ? 'px-2 py-2' : 'px-3 py-3'
        )}
        aria-busy={loadingVisibility}
      >
        {visibleGroups.map((group, groupIndex) => (
          <section
            key={group.label}
            className={clsx(groupIndex > 0 && (compact ? 'mt-2.5' : 'mt-4'))}
          >
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {t(group.label)}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      compact ? 'py-1.5' : 'py-2',
                      isActive
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    )
                  }
                >
                  {item.icon}
                  {t(item.label)}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <SidebarFooter compact={compact} />
    </aside>
  );
}
