import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSettings, updateSettings } from '../api/settings';
import { useAuth } from './AuthContext';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';
import {
  isModuleVisible,
  normalizeDisplayDensity,
  parseHiddenModules,
  serializeHiddenModules,
  type DisplayDensity,
  type OptionalModule,
} from '../utils/displayPreferences';

interface DisplayPreferencesContextValue {
  sidebarCollapsed: boolean;
  sidebarDensity: DisplayDensity;
  tableDensity: DisplayDensity;
  hiddenModules: OptionalModule[];
  loadingVisibility: boolean;
  setSidebarDensity: (density: DisplayDensity) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTableDensity: (density: DisplayDensity) => void;
  saveHiddenModules: (modules: OptionalModule[]) => Promise<void>;
  moduleIsVisible: (module?: OptionalModule) => boolean;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

function readDensity(setting: 'sidebarDensity' | 'tableDensity'): DisplayDensity {
  return normalizeDisplayDensity(readBrowserSetting(setting));
}

export function DisplayPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const [sidebarCollapsed, updateSidebarCollapsed] = useState(
    () => readBrowserSetting('sidebarCollapsed') === 'true'
  );
  const [sidebarDensity, updateSidebarDensity] = useState(() => readDensity('sidebarDensity'));
  const [tableDensity, updateTableDensity] = useState(() => readDensity('tableDensity'));
  const [hiddenModules, updateHiddenModules] = useState<OptionalModule[]>([]);
  const [loadingVisibility, setLoadingVisibility] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      updateHiddenModules([]);
      setLoadingVisibility(false);
      return;
    }
    let active = true;
    setLoadingVisibility(true);
    getSettings()
      .then((settings) => {
        if (active) updateHiddenModules(parseHiddenModules(settings.admin_hidden_modules));
      })
      .catch(() => {
        if (active) updateHiddenModules([]);
      })
      .finally(() => {
        if (active) setLoadingVisibility(false);
      });
    return () => {
      active = false;
    };
  }, [authenticated]);

  const setSidebarDensity = useCallback((density: DisplayDensity) => {
    writeBrowserSetting('sidebarDensity', density);
    updateSidebarDensity(density);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    writeBrowserSetting('sidebarCollapsed', String(collapsed));
    updateSidebarCollapsed(collapsed);
  }, []);

  const setTableDensity = useCallback((density: DisplayDensity) => {
    writeBrowserSetting('tableDensity', density);
    updateTableDensity(density);
  }, []);

  const saveHiddenModules = useCallback(async (modules: OptionalModule[]) => {
    const normalized = parseHiddenModules(serializeHiddenModules(modules));
    await updateSettings({ admin_hidden_modules: serializeHiddenModules(normalized) });
    updateHiddenModules(normalized);
  }, []);

  const value = useMemo<DisplayPreferencesContextValue>(
    () => ({
      sidebarCollapsed,
      sidebarDensity,
      tableDensity,
      hiddenModules,
      loadingVisibility,
      setSidebarDensity,
      setSidebarCollapsed,
      setTableDensity,
      saveHiddenModules,
      moduleIsVisible: (module) => isModuleVisible(module, hiddenModules),
    }),
    [
      hiddenModules,
      loadingVisibility,
      saveHiddenModules,
      setSidebarCollapsed,
      setSidebarDensity,
      sidebarCollapsed,
      setTableDensity,
      sidebarDensity,
      tableDensity,
    ]
  );

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences(): DisplayPreferencesContextValue {
  const context = useContext(DisplayPreferencesContext);
  if (!context) {
    throw new Error('useDisplayPreferences must be used within DisplayPreferencesProvider');
  }
  return context;
}
