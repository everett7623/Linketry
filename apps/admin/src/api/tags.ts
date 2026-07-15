import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Tag } from '@linketry/shared';

export function listTags(): Promise<Tag[]> {
  return apiGet('/api/v1/tags');
}

export interface TagPayload {
  name: string;
  color?: string | null;
  description?: string | null;
}

export function createTag(payload: TagPayload): Promise<Tag> {
  return apiPost('/api/v1/tags', payload);
}

export function updateTag(id: string, payload: TagPayload): Promise<Tag> {
  return apiPut(`/api/v1/tags/${id}`, payload);
}

export function deleteTag(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/v1/tags/${id}`);
}
