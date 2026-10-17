import React from 'react';
import { Archive, Power, PowerOff, Replace, RotateCcw, Tag, Trash2 } from 'lucide-react';
import type { BulkLinkAction } from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/Button';

interface LinkBulkActionBarProps {
  selectedCount: number;
  loading: boolean;
  onAction: (action: BulkLinkAction) => void;
  onEditTags: () => void;
  onReplaceUrls: () => void;
}

export function LinkBulkActionBar({
  selectedCount,
  loading,
  onAction,
  onEditTags,
  onReplaceUrls,
}: LinkBulkActionBarProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
      <span className="text-sm text-slate-300">{t('selectedCount', { count: selectedCount })}</span>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerOff size={14} />}
          onClick={() => onAction('disable')}
          loading={loading}
        >
          {t('disable')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Power size={14} />}
          onClick={() => onAction('enable')}
          loading={loading}
        >
          {t('enable')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Archive size={14} />}
          onClick={() => onAction('archive')}
          loading={loading}
        >
          {t('archive')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw size={14} />}
          onClick={() => onAction('restore')}
          loading={loading}
        >
          {t('restore')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Tag size={14} />}
          onClick={onEditTags}
          loading={loading}
        >
          {t('tags')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Replace size={14} />}
          onClick={onReplaceUrls}
          loading={loading}
        >
          {t('replaceUrls')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 size={14} />}
          onClick={() => onAction('delete')}
          loading={loading}
        >
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}
