import assert from 'node:assert/strict';
import test from 'node:test';
import { formatApiErrorMessage } from './apiErrorMessage.ts';

const labels: Record<string, string> = {
  apiUnauthorized: 'Unauthorized',
  apiForbidden: 'Forbidden',
  apiRateLimited: 'Rate limited',
  apiTimeout: 'Timed out',
  apiRequestFailed: 'Request failed',
};

const t = (key: string) => labels[key] ?? key;

function apiError(status: number, message: string) {
  return { name: 'ApiError', status, message };
}

test('maps HTTP status codes to localized keys', () => {
  assert.equal(formatApiErrorMessage(apiError(401, 'nope'), t), 'Unauthorized');
  assert.equal(formatApiErrorMessage(apiError(403, 'Forbidden'), t), 'Forbidden');
  assert.equal(formatApiErrorMessage(apiError(429, 'slow down'), t), 'Rate limited');
  assert.equal(formatApiErrorMessage(apiError(500, 'boom'), t), 'boom');
});

test('maps abort errors to timeout copy', () => {
  assert.equal(formatApiErrorMessage(new DOMException('Aborted', 'AbortError'), t), 'Timed out');
  assert.equal(formatApiErrorMessage(new Error('signal is aborted'), t), 'Timed out');
});

test('falls back for unknown failures', () => {
  assert.equal(formatApiErrorMessage('weird', t), 'Request failed');
});
