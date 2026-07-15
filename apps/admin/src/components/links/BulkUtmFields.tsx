import React from 'react';
import { BULK_UTM_KEYS, type BulkUtmKey, type BulkUtmMode } from '../../api/bulkUtm';
import { Input } from '../ui/Input';

export function BulkUtmFields({
  mode,
  selected,
  values,
  onSelectedChange,
  onValueChange,
}: {
  mode: BulkUtmMode;
  selected: Set<BulkUtmKey>;
  values: Partial<Record<BulkUtmKey, string>>;
  onSelectedChange: (key: BulkUtmKey, checked: boolean) => void;
  onValueChange: (key: BulkUtmKey, value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BULK_UTM_KEYS.map((key) => (
        <div key={key} className="grid grid-cols-[auto_1fr] items-end gap-2">
          <label className="mb-2 flex items-center">
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={(event) => onSelectedChange(key, event.target.checked)}
              aria-label={`Enable ${key}`}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
          </label>
          <Input
            label={key}
            value={values[key] ?? ''}
            onChange={(event) => onValueChange(key, event.target.value)}
            disabled={!selected.has(key) || mode === 'remove_selected'}
            maxLength={500}
          />
        </div>
      ))}
    </div>
  );
}
