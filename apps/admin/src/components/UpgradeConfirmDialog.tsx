import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface UpgradeConfirmDialogProps {
  open: boolean;
  version: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UpgradeConfirmDialog({
  open,
  version,
  onCancel,
  onConfirm,
}: UpgradeConfirmDialogProps) {
  const { t } = useLocale();

  return (
    <Modal open={open} onClose={onCancel} title={t('confirmUpgradeTitle')} size="sm">
      <p className="text-sm text-slate-300">{t('confirmUpgradeMessage', { version })}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          onClick={onConfirm}
        >
          {t('confirmUpgrade')}
        </Button>
      </div>
    </Modal>
  );
}
