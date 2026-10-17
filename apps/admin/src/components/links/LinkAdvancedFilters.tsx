import React from 'react';
import { Globe2, SlidersHorizontal } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { BulkUtmTool } from './BulkUtmTool';

export interface LinkAdvancedFilterValues {
  tag: string;
  source: string;
  domain: string;
  hasPassword: string;
  warning: string;
  limits: string;
  createdFrom: string;
  createdTo: string;
}

interface LinkAdvancedFiltersProps {
  values: LinkAdvancedFilterValues;
  selectedIds: string[];
  filteredCount: number;
  searchParams: URLSearchParams;
  onParamChange: (key: string, value: string) => void;
  onClear: () => void;
  onOpenDomainMigration: () => void;
  onBulkUtmCompleted: () => Promise<void>;
}

const textFieldClass =
  'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500';
const choiceFieldClass =
  'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500';

export function LinkAdvancedFilters({
  values,
  selectedIds,
  filteredCount,
  searchParams,
  onParamChange,
  onClear,
  onOpenDomainMigration,
  onBulkUtmCompleted,
}: LinkAdvancedFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <SlidersHorizontal size={15} className="text-brand-400" />
          {t('advancedFilters')}
        </div>
        <div className="flex items-center gap-3">
          <BulkUtmTool
            selectedIds={selectedIds}
            filteredCount={filteredCount}
            searchParams={searchParams}
            onCompleted={onBulkUtmCompleted}
          />
          <button
            type="button"
            onClick={onOpenDomainMigration}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
          >
            <Globe2 size={13} />
            {t('migrateShortDomain')}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            {t('clear')}
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <input
          type="text"
          aria-label={t('tag')}
          placeholder={t('tag')}
          value={values.tag}
          onChange={(e) => onParamChange('tag', e.target.value)}
          className={textFieldClass}
        />
        <input
          type="text"
          aria-label={t('sourcePlaceholder')}
          placeholder={t('sourcePlaceholder')}
          value={values.source}
          onChange={(e) => onParamChange('source', e.target.value)}
          className={textFieldClass}
        />
        <input
          type="text"
          aria-label={t('domain')}
          placeholder={t('domain')}
          value={values.domain}
          onChange={(e) => onParamChange('domain', e.target.value)}
          className={textFieldClass}
        />
        <select
          aria-label={t('anyPassword')}
          value={values.hasPassword}
          onChange={(e) => onParamChange('hasPassword', e.target.value)}
          className={choiceFieldClass}
        >
          <option value="">{t('anyPassword')}</option>
          <option value="yes">{t('passwordProtected')}</option>
          <option value="no">{t('noPassword')}</option>
        </select>
        <select
          aria-label={t('anyWarning')}
          value={values.warning}
          onChange={(e) => onParamChange('warning', e.target.value)}
          className={choiceFieldClass}
        >
          <option value="">{t('anyWarning')}</option>
          <option value="yes">{t('warningEnabled')}</option>
          <option value="no">{t('warningDisabled')}</option>
        </select>
        <select
          aria-label={t('anyLimits')}
          value={values.limits}
          onChange={(e) => onParamChange('limits', e.target.value)}
          className={choiceFieldClass}
        >
          <option value="">{t('anyLimits')}</option>
          <option value="yes">{t('hasLimits')}</option>
          <option value="no">{t('noLimits')}</option>
        </select>
        <input
          type="date"
          aria-label={t('createdFrom')}
          value={values.createdFrom}
          onChange={(e) => onParamChange('createdFrom', e.target.value)}
          className={choiceFieldClass}
        />
        <input
          type="date"
          aria-label={t('createdTo')}
          value={values.createdTo}
          onChange={(e) => onParamChange('createdTo', e.target.value)}
          className={choiceFieldClass}
        />
      </div>
    </div>
  );
}
