import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import { UpdateBanner } from './UpdateBanner';
import { DemoModeBanner } from './DemoModeBanner';
import { useLocale } from '../contexts/LocaleContext';
import { NAV_GROUPS } from './sidebar/sidebarNavigation';
import { UpdateCheckProvider, useUpdateCheckContext } from '../contexts/UpdateCheckContext';
import { OnlineUpgradeProvider } from '../contexts/OnlineUpgradeContext';
import { PageLoading } from './ui/PageLoading';
import { focusFirst, trapTabKey } from '../utils/focusTrap';
import { VersionCenterDialog } from './VersionCenterDialog';

export function Layout() {
  return (
    <UpdateCheckProvider>
      <OnlineUpgradeProvider>
        <LayoutContent />
      </OnlineUpgradeProvider>
    </UpdateCheckProvider>
  );
}

function LayoutContent() {
  const { sidebarCollapsed, sidebarDensity, tableDensity, setSidebarCollapsed } =
    useDisplayPreferences();
  const { t } = useLocale();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const updateCheck = useUpdateCheckContext();
  const pageLabel = resolvePageLabel(location.pathname);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => focusFirst(mobileDialogRef.current));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileSidebarOpen(false);
        return;
      }
      trapTabKey(event, mobileDialogRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    };
  }, [mobileSidebarOpen]);

  return (
    <div
      className="relative flex h-full min-w-0 overflow-hidden"
      data-sidebar-density={sidebarDensity}
      data-table-density={tableDensity}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {t('skipToContent')}
      </a>

      <div className="hidden h-full lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {mobileSidebarOpen && (
        <div
          ref={mobileDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('navigationMenu')}
          tabIndex={-1}
          className="fixed inset-0 z-40 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar
            mobile
            onClose={() => setMobileSidebarOpen(false)}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto bg-slate-950 outline-none">
        <div
          data-testid="desktop-toolbar"
          className="sticky top-0 z-30 hidden h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur lg:flex"
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              aria-label={t(sidebarCollapsed ? 'expandNavigation' : 'collapseNavigation')}
              title={t(sidebarCollapsed ? 'expandNavigation' : 'collapseNavigation')}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} aria-hidden="true" />
              )}
            </button>
            <span className="truncate text-sm font-semibold text-slate-200">
              {pageLabel ? t(pageLabel) : 'Linketry'}
            </span>
          </div>
        </div>
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur lg:hidden">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label={t('openNavigation')}
            title={t('openNavigation')}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="truncate text-sm font-semibold text-slate-100">Linketry</span>
        </div>
        <DemoModeBanner />
        <UpdateBanner update={updateCheck.update} onDismiss={updateCheck.dismiss} />
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-8">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <VersionCenterDialog returnFocusRef={mobileMenuButtonRef} />
    </div>
  );
}

function resolvePageLabel(pathname: string) {
  return NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]?.label;
}
