import { Eye, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminMode } from '../contexts/AdminModeContext';
import { useLocale } from '../contexts/LocaleContext';
import { IS_PUBLIC_DEMO } from '../config/demo';

export function AdminModeControl({ compact = false }: { compact?: boolean }) {
  const { isAdvanced, mode, setMode } = useAdminMode();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setMode(isAdvanced ? 'simple' : 'advanced')}
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        compact && 'w-9 px-0'
      )}
      aria-label={`${t('interfaceMode')}: ${t(mode)}`}
      title={compact ? `${t('interfaceMode')}: ${t(mode)}` : undefined}
    >
      <SlidersHorizontal size={17} aria-hidden="true" />
      {!compact && (
        <>
          <span className="hidden xl:inline">{t('interfaceMode')}</span>
          <span className="text-brand-400">{t(mode)}</span>
        </>
      )}
    </button>
  );
}

export function DemoReadOnlyStatus({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  if (!IS_PUBLIC_DEMO) return null;

  return (
    <div
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 text-xs font-medium text-amber-300',
        compact && 'w-9 px-0'
      )}
      title={compact ? t('demoReadOnlyLabel') : undefined}
    >
      <Eye size={17} aria-hidden="true" />
      {!compact && <span className="hidden 2xl:inline">{t('demoReadOnlyLabel')}</span>}
    </div>
  );
}
