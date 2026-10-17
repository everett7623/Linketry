import React from 'react';
import { Search } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface LinkFilterBarProps {
  searchInput: string;
  status: string;
  sort: string;
  onSearchInputChange: (value: string) => void;
  onParamChange: (key: string, value: string) => void;
}

export function LinkFilterBar({
  searchInput,
  status,
  sort,
  onSearchInputChange,
  onParamChange,
}: LinkFilterBarProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          aria-label={t('searchLinks')}
          placeholder={t('searchLinks')}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <select
        aria-label={t('statusFilter')}
        value={status}
        onChange={(e) => onParamChange('status', e.target.value)}
        className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">{t('allStatus')}</option>
        <option value="active">{t('activeStatus')}</option>
        <option value="disabled">{t('disabledStatus')}</option>
        <option value="expired">{t('expiredStatus')}</option>
        <option value="archived">{t('archivedStatus')}</option>
      </select>
      <select
        aria-label={t('sortLinks')}
        value={sort}
        onChange={(e) => onParamChange('sort', e.target.value)}
        className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="created_at_desc">{t('newestFirst')}</option>
        <option value="created_at_asc">{t('oldestFirst')}</option>
        <option value="clicks_desc">{t('mostClicks')}</option>
        <option value="last_clicked_at_desc">{t('recentlyClicked')}</option>
        <option value="last_clicked_at_asc">{t('leastRecentlyClicked')}</option>
        <option value="updated_at_desc">{t('recentlyUpdated')}</option>
        <option value="updated_at_asc">{t('oldestUpdated')}</option>
      </select>
    </div>
  );
}
