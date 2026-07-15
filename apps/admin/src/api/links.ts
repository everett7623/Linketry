import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Link, PaginatedResult } from '@linketry/shared';

export interface ListLinksParams {
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
  page?: number;
  pageSize?: number;
}

export function listLinks(params: ListLinksParams = {}): Promise<PaginatedResult<Link>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.tag) q.set('tag', params.tag);
  if (params.status) q.set('status', params.status);
  if (params.source) q.set('source', params.source);
  if (params.domain) q.set('domain', params.domain);
  if (params.createdFrom) q.set('createdFrom', params.createdFrom);
  if (params.createdTo) q.set('createdTo', params.createdTo);
  if (params.hasPassword) q.set('hasPassword', params.hasPassword);
  if (params.warning) q.set('warning', params.warning);
  if (params.limits) q.set('limits', params.limits);
  if (params.sort) q.set('sort', params.sort);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiGet(`/api/v1/links?${q.toString()}`);
}

export function getLink(id: string): Promise<Link> {
  return apiGet(`/api/v1/links/${id}`);
}

export interface DuplicateDestinationResult {
  normalized_url: string;
  items: Link[];
  total: number;
  has_more: boolean;
}

export function findDuplicateDestinations(
  url: string,
  excludeId?: string
): Promise<DuplicateDestinationResult> {
  const query = new URLSearchParams({ url, limit: '5' });
  if (excludeId) query.set('excludeId', excludeId);
  return apiGet(`/api/v1/links/duplicates?${query.toString()}`);
}

export interface CreateLinkPayload {
  long_url: string;
  slug?: string;
  domain?: string | null;
  title?: string;
  description?: string | null;
  tags?: string[];
  redirect_type?: 301 | 302;
  status?: string;
  expires_at?: string | null;
  max_clicks?: number | null;
  password?: string | null;
  warning_enabled?: number;
  fallback_url?: string | null;
}

export function createLink(payload: CreateLinkPayload): Promise<Link> {
  return apiPost('/api/v1/links', payload);
}

export function bulkCreateLinks(payload: CreateLinkPayload[]): Promise<{
  total: number;
  success: number;
  failed: number;
  items: Link[];
  results: Array<{ index: number; status: 'created' | 'failed'; slug?: string; id?: string; error?: string }>;
}> {
  return apiPost('/api/v1/links/bulk-create', { items: payload });
}

export function updateLink(id: string, payload: Partial<CreateLinkPayload>): Promise<Link> {
  return apiPut(`/api/v1/links/${id}`, payload);
}

export function deleteLink(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/v1/links/${id}`);
}

export function disableLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/v1/links/${id}/disable`);
}

export function enableLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/v1/links/${id}/enable`);
}

export function archiveLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/v1/links/${id}/archive`);
}

export function restoreLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/v1/links/${id}/restore`);
}

export type BulkLinkAction = 'disable' | 'enable' | 'archive' | 'restore' | 'delete';
export type BulkTagMode = 'add' | 'replace' | 'remove' | 'clear';

export function bulkLinkAction(
  ids: string[],
  action: BulkLinkAction
): Promise<{ action: BulkLinkAction; total: number; success: number; notFound: number }> {
  return apiPost('/api/v1/links/bulk', { ids, action });
}

export function bulkTagLinks(
  ids: string[],
  tags: string[],
  mode: BulkTagMode
): Promise<{ mode: BulkTagMode; tags: string[]; total: number; success: number; notFound: number }> {
  return apiPost('/api/v1/links/bulk-tag', { ids, tags, mode });
}
export interface BulkUrlPreviewItem { id:string;slug:string;current_url:string;next_url:string;status:'ready'|'unchanged'|'invalid';error:string|null; }
export function previewBulkUrlReplace(ids:string[],find:string,replace:string):Promise<{items:BulkUrlPreviewItem[];ready:number;unchanged:number;invalid:number;notFound:number}>{return apiPost('/api/v1/links/bulk-replace-url/preview',{ids,find,replace});}
export function confirmBulkUrlReplace(items:BulkUrlPreviewItem[]):Promise<{changed:number;skipped:number;rollback_csv:string}>{return apiPost('/api/v1/links/bulk-replace-url/confirm',{items:items.filter((item)=>item.status==='ready')});}

export interface DomainMigrationPreviewItem {
  id: string;
  slug: string;
  current_short_url: string;
  next_short_url: string;
}

export interface DomainMigrationPreview {
  source_domain: string;
  target_domain: string;
  total: number;
  target_registered: boolean;
  items: DomainMigrationPreviewItem[];
}

export function previewDomainMigration(sourceDomain: string, targetDomain: string): Promise<DomainMigrationPreview> {
  return apiPost('/api/v1/links/migrate-domain/preview', {
    source_domain: sourceDomain,
    target_domain: targetDomain,
  });
}

export function confirmDomainMigration(preview: DomainMigrationPreview): Promise<{
  changed: number;
  source_domain: string;
  target_domain: string;
  rollback_csv: string;
}> {
  return apiPost('/api/v1/links/migrate-domain/confirm', {
    source_domain: preview.source_domain,
    target_domain: preview.target_domain,
    expected_count: preview.total,
  });
}

export function getOverview(): Promise<{
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  recentLinks: Link[];
  topLinks: Link[];
}> {
  return apiGet('/api/v1/overview');
}
