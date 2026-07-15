import assert from 'node:assert/strict';
import test from 'node:test';
import {
  API_ROUTE_PREFIXES,
  API_V1_PREFIX,
  LEGACY_API_PREFIX,
  isLegacyApiPath,
} from './apiVersion.ts';

test('publishes the versioned namespace before the legacy alias', () => {
  assert.deepEqual(API_ROUTE_PREFIXES, ['/api/v1', '/api']);
  assert.equal(API_V1_PREFIX, '/api/v1');
  assert.equal(LEGACY_API_PREFIX, '/api');
});

test('marks only unversioned API requests as legacy', () => {
  assert.equal(isLegacyApiPath('/api/auth/login'), true);
  assert.equal(isLegacyApiPath('/api'), true);
  assert.equal(isLegacyApiPath('/api/v1/auth/login'), false);
  assert.equal(isLegacyApiPath('/api/v1'), false);
  assert.equal(isLegacyApiPath('/health'), false);
});
