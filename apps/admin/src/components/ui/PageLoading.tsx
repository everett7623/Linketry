import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocale } from '../../contexts/LocaleContext';

export function PageLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useLocale();

  return (
    <div
      role="status"
      aria-label={t('loadingPage')}
      className={clsx(
        'flex items-center justify-center bg-slate-950 text-brand-400',
        fullScreen ? 'h-screen' : 'h-64'
      )}
    >
      <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
    </div>
  );
}
