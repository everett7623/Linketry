import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { Domain } from '@linketry/shared';

export interface DomainPayload {
  domain: string;
  is_default?: boolean;
  status?: Domain['status'];
}

export function listDomains(): Promise<Domain[]> {
  return apiGet('/api/v1/domains');
}

export function createDomain(payload: DomainPayload): Promise<Domain> {
  return apiPost('/api/v1/domains', payload);
}

export function updateDomain(id: string, payload: DomainPayload): Promise<Domain> {
  return apiPut(`/api/v1/domains/${id}`, payload);
}

export function deleteDomain(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/v1/domains/${id}`);
}

export function setDefaultDomain(id: string): Promise<{ message: string; domain: string }> {
  return apiPost(`/api/v1/domains/${id}/set-default`);
}
