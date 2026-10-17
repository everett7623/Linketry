import React from 'react';
import type { Link as LinkType } from '@linketry/shared';
import type { BulkLinkAction } from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { ConfirmDialog } from '../ui/Modal';

export function LinkActionConfirmDialog({
  confirm,
  loading,
  onClose,
  onConfirm,
}: {
  confirm: { type: string; link: LinkType } | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (type: string, link: LinkType) => void;
}) {
  const { t } = useLocale();

  return (
    <ConfirmDialog
      open={!!confirm}
      onClose={onClose}
      onConfirm={() => confirm && onConfirm(confirm.type, confirm.link)}
      title={t(
        confirm?.type === 'delete'
          ? 'deleteLink'
          : confirm?.type === 'disable'
            ? 'disableLink'
            : 'archiveLink'
      )}
      message={
        confirm?.type === 'delete'
          ? t('deleteLinkConfirm', { slug: confirm.link.slug })
          : confirm?.type === 'disable'
            ? t('disableLinkConfirm', { slug: confirm?.link.slug ?? '' })
            : t('archiveLinkConfirm', { slug: confirm?.link.slug ?? '' })
      }
      confirmLabel={t(
        confirm?.type === 'delete' ? 'delete' : confirm?.type === 'disable' ? 'disable' : 'archive'
      )}
      confirmVariant={confirm?.type === 'delete' ? 'danger' : 'primary'}
      loading={loading}
    />
  );
}

export function BulkActionConfirmDialog({
  action,
  selectedCount,
  loading,
  onClose,
  onConfirm,
}: {
  action: BulkLinkAction | null;
  selectedCount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (action: BulkLinkAction) => void;
}) {
  const { t } = useLocale();

  return (
    <ConfirmDialog
      open={!!action}
      onClose={onClose}
      onConfirm={() => action && onConfirm(action)}
      title={t(
        action === 'delete' ? 'deleteLinks' : action === 'disable' ? 'disableLinks' : 'archiveLinks'
      )}
      message={
        action === 'delete'
          ? t('deleteLinksConfirm', { count: selectedCount })
          : action === 'disable'
            ? t('disableLinksConfirm', { count: selectedCount })
            : t('archiveLinksConfirm', { count: selectedCount })
      }
      confirmLabel={t(action === 'delete' ? 'delete' : action === 'disable' ? 'disable' : 'archive')}
      confirmVariant={action === 'delete' ? 'danger' : 'primary'}
      loading={loading}
    />
  );
}
