import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Tag } from '@linkora/shared';

export function listTags(): Promise<Tag[]> {
  return apiGet('/api/tags');
}

export interface TagPayload {
  name: string;
  color?: string | null;
  description?: string | null;
}

export function createTag(payload: TagPayload): Promise<Tag> {
  return apiPost('/api/tags', payload);
}

export function updateTag(id: string, payload: TagPayload): Promise<Tag> {
  return apiPut(`/api/tags/${id}`, payload);
}

export function deleteTag(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/tags/${id}`);
}
