export type BrowserSetting = 'adminMode' | 'apiBase' | 'locale' | 'token';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEYS: Record<BrowserSetting, { current: string; legacy: string }> = {
  adminMode: { current: 'linketry_admin_mode', legacy: 'linkora_admin_mode' },
  apiBase: { current: 'linketry_api_base', legacy: 'linkora_api_base' },
  locale: { current: 'linketry.locale', legacy: 'linkora.locale' },
  token: { current: 'linketry_token', legacy: 'linkora_token' },
};

export function readBrowserSetting(
  setting: BrowserSetting,
  storage: StorageLike = window.localStorage
): string | null {
  const keys = STORAGE_KEYS[setting];
  const current = storage.getItem(keys.current);
  if (current !== null) return current;

  const legacy = storage.getItem(keys.legacy);
  if (legacy !== null) storage.setItem(keys.current, legacy);
  return legacy;
}

export function writeBrowserSetting(
  setting: BrowserSetting,
  value: string,
  storage: StorageLike = window.localStorage
): void {
  storage.setItem(STORAGE_KEYS[setting].current, value);
}

export function removeBrowserSetting(
  setting: BrowserSetting,
  storage: StorageLike = window.localStorage
): void {
  const keys = STORAGE_KEYS[setting];
  storage.removeItem(keys.current);
  storage.removeItem(keys.legacy);
}
