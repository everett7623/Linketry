import assert from 'node:assert/strict';
import test from 'node:test';
import { readBrowserSetting, removeBrowserSetting, writeBrowserSetting } from './browserStorage.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

test('migrates a legacy Linkora token without deleting the rollback copy', () => {
  const storage = memoryStorage({ linkora_token: 'legacy-token' });

  assert.equal(readBrowserSetting('token', storage), 'legacy-token');
  assert.equal(storage.getItem('linketry_token'), 'legacy-token');
  assert.equal(storage.getItem('linkora_token'), 'legacy-token');
});

test('prefers the canonical Linketry setting', () => {
  const storage = memoryStorage({
    linketry_api_base: 'https://new.example.com',
    linkora_api_base: 'https://old.example.com',
  });

  assert.equal(readBrowserSetting('apiBase', storage), 'https://new.example.com');
});

test('writes canonical settings and removes both generations on logout', () => {
  const storage = memoryStorage({ linkora_token: 'legacy-token' });
  writeBrowserSetting('token', 'current-token', storage);
  assert.equal(storage.getItem('linketry_token'), 'current-token');

  removeBrowserSetting('token', storage);
  assert.equal(storage.getItem('linketry_token'), null);
  assert.equal(storage.getItem('linkora_token'), null);
});
