import type { MessageKey } from '../i18n/messages';

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

function isApiErrorLike(error: unknown): error is { status: number; message: string; name?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Map API / network failures to localized Admin copy when possible.
 * Falls back to the server message or a generic string.
 */
export function formatApiErrorMessage(error: unknown, t: Translate): string {
  if (isApiErrorLike(error)) {
    if (error.status === 401) return t('apiUnauthorized');
    if (error.status === 403) {
      if (/read-only|demo/i.test(error.message)) return error.message;
      return t('apiForbidden');
    }
    if (error.status === 429) return t('apiRateLimited');
    if (error.message.trim()) return error.message;
    return t('apiRequestFailed');
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return t('apiTimeout');
  }

  if (error instanceof Error && error.message.trim()) {
    if (/aborted|timeout/i.test(error.message)) return t('apiTimeout');
    return error.message;
  }

  return t('apiRequestFailed');
}
