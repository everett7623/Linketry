export type BrowserSetting =
  | 'adminMode'
  | 'analyticsAutoRefresh'
  | 'analyticsRefreshInterval'
  | 'apiBase'
  | 'demoAccess'
  | 'dismissedUpdateVersion'
  | 'linkView'
  | 'lastLoadedVersion'
  | 'locale'
  | 'sidebarCollapsed'
  | 'sidebarDensity'
  | 'tableDensity'
  | 'theme'
  | 'token'
  | 'updateCheck';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEYS: Record<BrowserSetting, string> = {
  adminMode: 'linketry_admin_mode',
  analyticsAutoRefresh: 'linketry_analytics_auto_refresh',
  analyticsRefreshInterval: 'linketry_analytics_refresh_interval',
  apiBase: 'linketry_api_base',
  demoAccess: 'linketry_demo_access',
  dismissedUpdateVersion: 'linketry_dismissed_update_version',
  linkView: 'linketry_link_view',
  lastLoadedVersion: 'linketry_last_loaded_version',
  locale: 'linketry.locale',
  sidebarCollapsed: 'linketry_sidebar_collapsed',
  sidebarDensity: 'linketry_sidebar_density',
  tableDensity: 'linketry_table_density',
  theme: 'linketry_theme',
  token: 'linketry_token',
  updateCheck: 'linketry_update_check',
};

/**
 * Storage is unavailable in Safari Private Browsing and whenever site data is blocked,
 * where even reading `window.localStorage` throws. Falling back to memory keeps the
 * session usable for the current tab instead of breaking sign-in.
 */
function memoryFallback(): StorageLike {
  return {
    getItem: (key) => inMemoryValues.get(key) ?? null,
    setItem: (key, value) => void inMemoryValues.set(key, value),
    removeItem: (key) => void inMemoryValues.delete(key),
  };
}

const inMemoryValues = new Map<string, string>();

function resolveStorage(storage?: StorageLike): StorageLike {
  if (storage) return storage;
  try {
    const local = window.localStorage;
    // Some browsers expose the object but reject every write.
    local.setItem('linketry_storage_probe', '1');
    local.removeItem('linketry_storage_probe');
    return local;
  } catch {
    return memoryFallback();
  }
}

export function readBrowserSetting(
  setting: BrowserSetting,
  storage?: StorageLike
): string | null {
  try {
    return resolveStorage(storage).getItem(STORAGE_KEYS[setting]);
  } catch {
    return null;
  }
}

export function writeBrowserSetting(
  setting: BrowserSetting,
  value: string,
  storage?: StorageLike
): void {
  try {
    resolveStorage(storage).setItem(STORAGE_KEYS[setting], value);
  } catch {
    // Preference is lost for this session; the app still works.
  }
}

export function removeBrowserSetting(
  setting: BrowserSetting,
  storage?: StorageLike
): void {
  try {
    resolveStorage(storage).removeItem(STORAGE_KEYS[setting]);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
