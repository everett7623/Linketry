export const DEFAULT_LINK_PAGE_SIZE = 20;
export const DEFAULT_AUDIT_PAGE_SIZE = 50;
export const MAX_LIST_PAGE_SIZE = 100;
export const MAX_LIST_PAGE = 100_000;

const LINK_SORTS: Record<string, string> = {
  created_at_desc: 'created_at DESC, id DESC',
  created_at_asc: 'created_at ASC, id ASC',
  clicks_desc: 'clicks DESC, id DESC',
  clicks_asc: 'clicks ASC, id ASC',
  last_clicked_at_desc: 'last_clicked_at DESC NULLS LAST, id DESC',
  last_clicked_at_asc: 'last_clicked_at ASC NULLS LAST, id ASC',
  updated_at_desc: 'updated_at DESC, id DESC',
  updated_at_asc: 'updated_at ASC, id ASC',
};

export const AUDIT_ORDER_BY = 'created_at DESC, id DESC';

export function linkOrderBy(sort?: string): string {
  return LINK_SORTS[sort ?? 'created_at_desc'] ?? LINK_SORTS.created_at_desc;
}

export function normalizeListPage(
  value: string | undefined,
  fallback = 1
): number {
  return normalizeBoundedPositiveInteger(value, fallback, MAX_LIST_PAGE);
}

export function normalizeListPageSize(
  value: string | undefined,
  fallback: number
): number {
  return normalizeBoundedPositiveInteger(value, fallback, MAX_LIST_PAGE_SIZE);
}

export function normalizeBoundedPositiveInteger(
  value: string | undefined,
  fallback: number,
  max: number
): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
