import { RefreshCw } from 'lucide-react';
import type { UpdateCheckResult } from '../api/updates';
import { useLocale } from '../contexts/LocaleContext';
import { useToast } from './ui/Toast';

interface UpdateCheckButtonProps {
  checking: boolean;
  updateAvailable: boolean;
  onCheck: () => Promise<UpdateCheckResult>;
}

export function UpdateCheckButton({ checking, updateAvailable, onCheck }: UpdateCheckButtonProps) {
  const { t } = useLocale();
  const { success, warning } = useToast();

  const handleCheck = async () => {
    try {
      const result = await onCheck();
      if (result.updateAvailable) {
        warning(t('updateAvailableTitle', { version: result.latestVersion }));
      } else {
        success(t('updateCheckCurrent', { version: result.currentVersion }));
      }
    } catch {
      warning(t('updateCheckFailed'));
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCheck()}
      disabled={checking}
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait disabled:opacity-60"
      aria-label={t(checking ? 'checkingForUpdates' : 'checkForUpdates')}
      title={t(checking ? 'checkingForUpdates' : 'checkForUpdates')}
    >
      <RefreshCw className={`h-[17px] w-[17px] ${checking ? 'animate-spin' : ''}`} aria-hidden />
      {updateAvailable && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-slate-950" />
      )}
    </button>
  );
}
