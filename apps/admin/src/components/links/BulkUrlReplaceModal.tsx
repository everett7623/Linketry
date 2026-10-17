import React, { useState } from 'react';
import {
  confirmBulkUrlReplace,
  previewBulkUrlReplace,
  type BulkUrlPreviewItem,
} from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { formatApiErrorMessage } from '../../utils/apiErrorMessage';
import { downloadText } from '../../utils/downloadText';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// Stays mounted while closed so the find/replace text survives reopening.
export function BulkUrlReplaceModal({
  open,
  selectedIds,
  onClose,
  onCompleted,
}: {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onCompleted: () => Promise<void>;
}) {
  const { t } = useLocale();
  const { success, error } = useToast();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [preview, setPreview] = useState<BulkUrlPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    try {
      const result = await previewBulkUrlReplace(selectedIds, findText, replaceText);
      setPreview(result.items);
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  const confirmReplace = async () => {
    setLoading(true);
    try {
      const result = await confirmBulkUrlReplace(preview);
      downloadText(
        result.rollback_csv,
        `linketry-url-rollback-${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8'
      );
      success(t('bulkUrlsUpdated', { count: result.changed }));
      setPreview([]);
      await onCompleted();
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('replaceUrls')} size="xl">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('findText')}
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setPreview([]);
            }}
          />
          <Input
            label={t('replaceWith')}
            value={replaceText}
            onChange={(e) => {
              setReplaceText(e.target.value);
              setPreview([]);
            }}
          />
        </div>
        <p className="text-xs text-yellow-300">{t('replaceUrlGuidance')}</p>
        {preview.length > 0 && (
          <div className="max-h-72 overflow-auto border border-slate-800">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-800">
                {preview.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-mono text-slate-400">/{item.slug}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-slate-500">{item.next_url}</td>
                    <td className="px-3 py-2 text-right">
                      {t(
                        item.status === 'ready'
                          ? 'readyStatus'
                          : item.status === 'invalid'
                            ? 'invalidStatus'
                            : 'unchangedStatus'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={runPreview} disabled={!findText} loading={loading}>
            {t('previewChanges')}
          </Button>
          <Button
            onClick={confirmReplace}
            disabled={!preview.some((item) => item.status === 'ready')}
            loading={loading}
          >
            {t('confirmReplace')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
