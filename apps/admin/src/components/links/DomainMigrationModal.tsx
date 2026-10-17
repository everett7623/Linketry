import React, { useState } from 'react';
import {
  confirmDomainMigration,
  previewDomainMigration,
  type DomainMigrationPreview,
} from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { formatApiErrorMessage } from '../../utils/apiErrorMessage';
import { downloadText } from '../../utils/downloadText';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// Mount only while open so each open is seeded from the current domain filter and default domain.
export function DomainMigrationModal({
  initialSourceDomain,
  initialTargetDomain,
  onClose,
  onCompleted,
}: {
  initialSourceDomain: string;
  initialTargetDomain: string;
  onClose: () => void;
  onCompleted: () => Promise<void>;
}) {
  const { t } = useLocale();
  const { success, error } = useToast();
  const [sourceDomain, setSourceDomain] = useState(initialSourceDomain);
  const [targetDomain, setTargetDomain] = useState(initialTargetDomain);
  const [preview, setPreview] = useState<DomainMigrationPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    try {
      setPreview(await previewDomainMigration(sourceDomain, targetDomain));
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const result = await confirmDomainMigration(preview);
      downloadText(
        result.rollback_csv,
        `linketry-domain-migration-${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8'
      );
      success(t('domainMigrationComplete', { count: result.changed }));
      setPreview(null);
      await onCompleted();
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('migrateShortDomain')} size="xl">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('sourceShortDomain')}
            value={sourceDomain}
            placeholder="s.y8o.de"
            onChange={(event) => {
              setSourceDomain(event.target.value);
              setPreview(null);
            }}
          />
          <Input
            label={t('targetShortDomain')}
            value={targetDomain}
            placeholder="go.uukk.de"
            onChange={(event) => {
              setTargetDomain(event.target.value);
              setPreview(null);
            }}
          />
        </div>
        <p className="text-xs text-yellow-300">{t('domainMigrationGuidance')}</p>
        {preview && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              {t('domainMigrationCount', { count: preview.total })}
            </div>
            {!preview.target_registered && (
              <p className="text-xs text-orange-300">{t('targetDomainNotRegistered')}</p>
            )}
            {preview.items.length > 0 && (
              <div className="max-h-72 overflow-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-800">
                    {preview.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-mono text-slate-400">/{item.slug}</td>
                        <td className="max-w-sm truncate px-3 py-2 text-slate-500">
                          {item.next_short_url}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={runPreview}
            disabled={!sourceDomain.trim() || !targetDomain.trim()}
            loading={loading}
          >
            {t('previewMigration')}
          </Button>
          <Button
            onClick={runMigration}
            disabled={!preview || preview.total < 1}
            loading={loading}
          >
            {t('confirmDomainMigration')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
