import type { RedirectRule, RedirectRuleTarget, RedirectRuleType } from '@linketry/shared';
import { apiDelete, apiGet, apiPost, apiPut } from './client';

export interface RedirectRulesList {
  items: RedirectRule[];
  total: number;
}

export interface RedirectRulePayload {
  link_id: string;
  rule_type: RedirectRuleType;
  priority?: number;
  enabled?: boolean;
  values?: string[];
  targetUrl?: string;
  targets?: RedirectRuleTarget[];
}

export function listRedirectRules(linkId?: string): Promise<RedirectRulesList> {
  const query = linkId ? `?linkId=${encodeURIComponent(linkId)}` : '';
  return apiGet(`/api/v1/redirect-rules${query}`);
}

export function createRedirectRule(payload: RedirectRulePayload): Promise<RedirectRule> {
  return apiPost('/api/v1/redirect-rules', payload);
}

export function updateRedirectRule(id: string, payload: RedirectRulePayload): Promise<RedirectRule> {
  return apiPut(`/api/v1/redirect-rules/${id}`, payload);
}

export function deleteRedirectRule(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/v1/redirect-rules/${id}`);
}
