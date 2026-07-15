import React, { useEffect, useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  BULK_UTM_KEYS,
  bulkUtmFiltersFromSearchParams,
  confirmBulkUtm,
  previewBulkUtm,
  type BulkUtmKey,
  type BulkUtmMode,
  type BulkUtmPreview,
  type BulkUtmRequest,
  type BulkUtmScopeType,
} from '../../api/bulkUtm';
import { useLocale } from '../../contexts/LocaleContext';
import { downloadText } from '../../utils/downloadText';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { BulkUtmFields } from './BulkUtmFields';

export function BulkUtmTool({
  selectedIds,
  filteredCount,
  searchParams,
  onCompleted,
}: {
  selectedIds: string[];
  filteredCount: number;
  searchParams: URLSearchParams;
  onCompleted: () => void | Promise<void>;
}) {
  const { t } = useLocale();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState<BulkUtmScopeType>('filtered');
  const [mode, setMode] = useState<BulkUtmMode>('add_missing');
  const [selected, setSelected] = useState<Set<BulkUtmKey>>(
    new Set(['utm_source'])
  );
  const [values, setValues] = useState<Partial<Record<BulkUtmKey, string>>>({});
  const [preview, setPreview] = useState<BulkUtmPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const filters = useMemo(
    () => bulkUtmFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  useEffect(() => {
    if (scopeType === 'selected' && selectedIds.length === 0) setScopeType('filtered');
  }, [scopeType, selectedIds.length]);

  const resetPreview = () => setPreview(null);
  const request = (): BulkUtmRequest => ({
    mode,
    parameters: BULK_UTM_KEYS.filter((key) => selected.has(key)),
    values,
  });

  const validate = (payload: BulkUtmRequest): boolean => {
    if (payload.parameters.length === 0) {
      toast.error(t('bulkUtmSelectParameter'));
      return false;
    }
    if (mode !== 'remove_selected' && payload.parameters.some((key) => !values[key]?.trim())) {
      toast.error(t('bulkUtmValueRequired'));
      return false;
    }
    return true;
  };

  const runPreview = async () => {
    const payload = request();
    if (!validate(payload)) return;
    setLoading(true);
    try {
      const scope = scopeType === 'selected'
        ? { type: 'selected' as const, ids: selectedIds }
        : { type: 'filtered' as const, filters };
      setPreview(await previewBulkUtm(payload, scope));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    const payload = request();
    if (!validate(payload)) return;
    setLoading(true);
    try {
      const result = await confirmBulkUtm(
        payload,
        preview.items.filter((item) => item.status === 'ready')
      );
      downloadText(
        result.change_csv,
        `linketry-utm-changes-${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8'
      );
      toast.success(t('bulkUtmComplete', result));
      setOpen(false);
      setPreview(null);
      await onCompleted();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setScopeType(selectedIds.length > 0 ? 'selected' : 'filtered'); setOpen(true); }}
        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
      >
        <Link2 size={13} />
        {t('bulkUtm')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('bulkUtmTitle')} size="xl">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t('bulkUtmScope')}
              value={scopeType}
              onChange={(event) => { setScopeType(event.target.value as BulkUtmScopeType); resetPreview(); }}
            >
              <option value="selected" disabled={selectedIds.length === 0}>
                {t('bulkUtmSelectedScope', { count: selectedIds.length })}
              </option>
              <option value="filtered">{t('bulkUtmFilteredScope', { count: filteredCount })}</option>
            </Select>
            <Select
              label={t('bulkUtmMode')}
              value={mode}
              onChange={(event) => { setMode(event.target.value as BulkUtmMode); resetPreview(); }}
            >
              <option value="add_missing">{t('bulkUtmAddMissing')}</option>
              <option value="replace_selected">{t('bulkUtmReplaceSelected')}</option>
              <option value="remove_selected">{t('bulkUtmRemoveSelected')}</option>
            </Select>
          </div>
          <BulkUtmFields
            mode={mode}
            selected={selected}
            values={values}
            onSelectedChange={(key, checked) => {
              setSelected((current) => { const next = new Set(current); checked ? next.add(key) : next.delete(key); return next; });
              resetPreview();
            }}
            onValueChange={(key, value) => { setValues((current) => ({ ...current, [key]: value })); resetPreview(); }}
          />
          <p className="text-xs text-yellow-300">{t('bulkUtmGuidance')}</p>
          {preview && (
            <div className="space-y-3">
              <p className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                {t('bulkUtmPreviewSummary', { total: preview.scope.total, ready: preview.ready, unchanged: preview.unchanged, invalid: preview.invalid })}
              </p>
              {preview.limit_exceeded && <p className="text-sm text-red-300">{t('bulkUtmLimitExceeded', { total: preview.scope.total, limit: preview.limit })}</p>}
              {preview.conflicts > 0 && <p className="text-xs text-orange-300">{t('bulkUtmConflicts', { count: preview.conflicts })}</p>}
              {preview.items.length > 0 && <div className="max-h-64 overflow-auto rounded-lg border border-slate-800"><table className="w-full text-xs"><tbody className="divide-y divide-slate-800">{preview.items.map((item) => <tr key={item.id}><td className="px-3 py-2 font-mono text-slate-400">/{item.slug}</td><td className="max-w-sm space-y-1 px-3 py-2 text-slate-500"><p className="truncate" title={item.current_url}><span className="text-slate-400">{t('bulkUtmBefore')}:</span> {item.current_url}</p><p className="truncate" title={item.next_url}><span className="text-slate-400">{t('bulkUtmAfter')}:</span> {item.next_url}</p>{item.conflicts.length > 0 && <p className="text-orange-300">{t('bulkUtmConflictRow', { parameters: item.conflicts.join(', ') })}</p>}{item.error && <p className="text-red-300">{item.error}</p>}</td><td className="px-3 py-2 text-right text-slate-300">{t(item.status === 'ready' ? 'readyStatus' : item.status === 'invalid' ? 'invalidStatus' : 'unchangedStatus')}</td></tr>)}</tbody></table></div>}
              <p className="text-xs text-slate-500">{t('bulkUtmBackupHint')}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>{t('cancel')}</Button>
            <Button variant="secondary" onClick={runPreview} loading={loading}>{t('previewChanges')}</Button>
            <Button onClick={apply} loading={loading} disabled={!preview || preview.limit_exceeded || preview.ready === 0}>{t('bulkUtmApply')}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
