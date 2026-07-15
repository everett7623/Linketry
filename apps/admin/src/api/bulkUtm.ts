import { apiPost } from './client';

export const BULK_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type BulkUtmKey = (typeof BULK_UTM_KEYS)[number];
export type BulkUtmMode = 'add_missing' | 'replace_selected' | 'remove_selected';
export type BulkUtmScopeType = 'selected' | 'filtered';

export interface BulkUtmFilters {
  keyword?: string;
  tag?: string;
  status?: string;
  source?: string;
  domain?: string;
  createdFrom?: string;
  createdTo?: string;
  hasPassword?: string;
  warning?: string;
  limits?: string;
  sort?: string;
}

export interface BulkUtmPreviewItem {
  id: string;
  slug: string;
  current_url: string;
  next_url: string;
  status: 'ready' | 'unchanged' | 'invalid';
  conflicts: BulkUtmKey[];
  error: string | null;
}

export interface BulkUtmPreview {
  scope: { type: BulkUtmScopeType; total: number; requested: number; not_found: number };
  items: BulkUtmPreviewItem[];
  ready: number;
  unchanged: number;
  invalid: number;
  conflicts: number;
  limit: number;
  limit_exceeded: boolean;
}

export interface BulkUtmRequest {
  mode: BulkUtmMode;
  parameters: BulkUtmKey[];
  values: Partial<Record<BulkUtmKey, string>>;
}

export function bulkUtmFiltersFromSearchParams(searchParams: URLSearchParams): BulkUtmFilters {
  const filters: BulkUtmFilters = {};
  const keys: Array<keyof BulkUtmFilters> = [
    'keyword', 'tag', 'status', 'source', 'domain', 'createdFrom', 'createdTo',
    'hasPassword', 'warning', 'limits', 'sort',
  ];
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

export function previewBulkUtm(
  request: BulkUtmRequest,
  scope: { type: 'selected'; ids: string[] } | { type: 'filtered'; filters: BulkUtmFilters }
): Promise<BulkUtmPreview> {
  return apiPost('/api/v1/links/bulk-utm/preview', { ...request, scope });
}

export function confirmBulkUtm(
  request: BulkUtmRequest,
  items: BulkUtmPreviewItem[]
): Promise<{ changed: number; skipped: number; change_csv: string }> {
  return apiPost('/api/v1/links/bulk-utm/confirm', { ...request, items }, 30_000);
}
