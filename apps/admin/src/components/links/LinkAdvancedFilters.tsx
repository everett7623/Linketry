import React, { useId, useState } from 'react';
import { ChevronDown, Globe2, SlidersHorizontal } from 'lucide-react';
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
  // Below `md` the eight fields push results past the fold, so they start collapsed there;
  // from `md` up they are always shown and the toggle is hidden.
  const [expanded, setExpanded] = useState(false);
  const fieldsId = useId();
  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 md:mb-3 ${expanded ? 'mb-3' : ''}`}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={fieldsId}
          onClick={() => setExpanded((open) => !open)}
          className="flex items-center gap-2 rounded-md text-sm font-semibold text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
        >
          <SlidersHorizontal size={15} className="text-brand-400" aria-hidden="true" />
          {t('advancedFilters')}
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">
              {t('advancedFiltersActive', { count: activeCount })}
            </span>
          )}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="hidden items-center gap-2 text-sm font-semibold text-slate-300 md:flex">
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
      <div
        id={fieldsId}
        className={`${expanded ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-3 xl:grid-cols-6`}
      >
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
