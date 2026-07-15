import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { findDuplicateDestinations, type DuplicateDestinationResult } from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';

export function DuplicateDestinationWarning({ url, excludeId }: { url: string; excludeId?: string }) {
  const { t } = useLocale();
  const [result, setResult] = useState<DuplicateDestinationResult | null>(null);

  useEffect(() => {
    const value = url.trim();
    setResult(null);
    if (!/^https?:\/\//i.test(value)) return;
    let current = true;
    const timer = window.setTimeout(() => {
      findDuplicateDestinations(value, excludeId)
        .then((next) => { if (current) setResult(next); })
        .catch(() => { if (current) setResult(null); });
    }, 400);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [url, excludeId]);

  if (!result?.items.length) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3" role="status">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={16} />
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-amber-100">
            {t('duplicateDestinationWarning', { count: result.total })}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.items.map((link) => (
              <RouterLink
                key={link.id}
                to={`/links/${link.id}/edit`}
                className="max-w-full truncate rounded bg-slate-950/60 px-2 py-1 font-mono text-xs text-amber-300 hover:text-amber-200"
                title={link.long_url}
              >
                /{link.slug}{link.title ? ` · ${link.title}` : ''}
              </RouterLink>
            ))}
          </div>
          {result.has_more && <p className="text-xs text-amber-200/70">{t('duplicateDestinationMore')}</p>}
        </div>
      </div>
    </div>
  );
}
