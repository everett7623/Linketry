import { apiPost } from './client';
import type { LinkSuggestionResult } from '@linketry/shared';

export interface PageTitleResult {
  title: string;
  final_url: string;
}
export interface PagePreviewResult { title: string | null; description: string | null; image: string | null; final_url: string; }
export function fetchPagePreview(url: string): Promise<PagePreviewResult> { return apiPost('/api/v1/metadata/preview', { url }); }

export function fetchPageTitle(url: string): Promise<PageTitleResult> {
  return apiPost('/api/v1/metadata/title', { url });
}

export function fetchLinkSuggestions(url: string): Promise<LinkSuggestionResult> {
  return apiPost('/api/v1/metadata/suggestions', { url });
}
