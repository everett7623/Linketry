import { apiGet, apiPost } from './client';
import type { ApiToken, ApiTokenScope } from '@linkora/shared';

export interface CreateApiTokenPayload {
  name: string;
  scopes: ApiTokenScope[];
}

export interface CreateApiTokenResult {
  token: string;
  item: ApiToken;
}

export function listApiTokens(): Promise<ApiToken[]> {
  return apiGet('/api/tokens');
}

export function createApiToken(payload: CreateApiTokenPayload): Promise<CreateApiTokenResult> {
  return apiPost('/api/tokens', payload);
}

export function revokeApiToken(id: string): Promise<{ message: string; revokedAt: string }> {
  return apiPost(`/api/tokens/${id}/revoke`);
}
