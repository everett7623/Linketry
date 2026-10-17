import React from 'react';
import { Copy, Download } from 'lucide-react';
import type { Link as LinkType } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export interface LinkQrCode {
  link: LinkType;
  url: string;
  dataUrl: string;
}

export function QrCodeModal({
  qr,
  onClose,
  onCopy,
  onDownload,
}: {
  qr: LinkQrCode | null;
  onClose: () => void;
  onCopy: (link: LinkType) => void;
  onDownload: () => void;
}) {
  const { t } = useLocale();

  return (
    <Modal
      open={!!qr}
      onClose={onClose}
      title={qr ? t('qrCodeTitle', { slug: qr.link.slug }) : t('qrCode')}
      size="sm"
    >
      {qr && (
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4">
            <img src={qr.dataUrl} alt={t('qrCodeFor', { url: qr.url })} className="h-auto w-full" />
          </div>
          <p className="break-all font-mono text-xs text-slate-400">{qr.url}</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCopy(qr.link)}
              icon={<Copy size={14} />}
            >
              {t('copyLink')}
            </Button>
            <Button size="sm" onClick={onDownload} icon={<Download size={14} />}>
              {t('downloadPng')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
