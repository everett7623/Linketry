import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  englishMessages,
  getLoadedCatalog,
  loadCatalog,
  type Locale,
  type MessageCatalog,
  type MessageKey,
} from '../i18n/messages';
import { formatMessage, type MessageVariables } from '../i18n/formatMessage';
import { DEFAULT_LOCALE, getLocaleDefinition, resolveLocale } from '../i18n/locales';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, variables?: MessageVariables) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function initialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return resolveLocale(readBrowserSetting('locale'));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  const [catalog, setCatalog] = useState<MessageCatalog>(
    () => getLoadedCatalog(locale) ?? englishMessages
  );

  useEffect(() => {
    const definition = getLocaleDefinition(locale);
    document.documentElement.lang = definition.htmlLang;
    document.documentElement.dir = definition.direction;
  }, [locale]);

  useEffect(() => {
    let active = true;
    const loaded = getLoadedCatalog(locale);
    if (loaded) {
      setCatalog(loaded);
      return;
    }
    loadCatalog(locale).then(
      (next) => {
        if (active) setCatalog(next);
      },
      () => {
        if (active) setCatalog(englishMessages);
      }
    );
    return () => {
      active = false;
    };
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale(next) {
        writeBrowserSetting('locale', next);
        if (getLoadedCatalog(next)) updateLocale(next);
        else loadCatalog(next).catch(() => undefined).then(() => updateLocale(next));
      },
      t(key, variables = {}) {
        return formatMessage(catalog[key] ?? englishMessages[key], variables);
      },
    }),
    [locale, catalog]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
