import { apiGet } from './client';
import type { AuditLog, PaginatedResult } from '@linkora/shared';

export interface ListAuditParams {
  keyword?: string;
  action?: string;
  targetType?: string;
  page?: number;
  pageSize?: number;
}

export function listAuditLogs(params: ListAuditParams = {}): Promise<PaginatedResult<AuditLog>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.action) q.set('action', params.action);
  if (params.targetType) q.set('targetType', params.targetType);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiGet(`/api/audit?${q.toString()}`);
}
