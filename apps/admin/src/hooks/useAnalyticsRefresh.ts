import { useCallback, useEffect, useRef, useState } from 'react';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';
import {
  normalizeAnalyticsRefreshInterval,
  type AnalyticsRefreshInterval,
} from '../utils/analyticsRefresh';

interface AnalyticsRefreshOptions<T> {
  load: () => Promise<T>;
  onData: (data: T) => void;
  onError: () => void;
}

export function useAnalyticsRefresh<T>({ load, onData, onError }: AnalyticsRefreshOptions<T>) {
  const [autoRefresh, updateAutoRefresh] = useState(
    () => readBrowserSetting('analyticsAutoRefresh') !== 'false'
  );
  const [intervalSeconds, updateIntervalSeconds] = useState<AnalyticsRefreshInterval>(() =>
    normalizeAnalyticsRefreshInterval(readBrowserSetting('analyticsRefreshInterval'))
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const activeRef = useRef(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(
    async (notifyError = true) => {
      const requestId = ++requestIdRef.current;
      setRefreshing(true);
      try {
        const result = await load();
        if (!activeRef.current || requestId !== requestIdRef.current) return;
        onData(result);
        setLastUpdated(new Date());
      } catch {
        if (activeRef.current && requestId === requestIdRef.current && notifyError) onError();
      } finally {
        if (activeRef.current && requestId === requestIdRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    },
    [load, onData, onError]
  );

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(false);
    }, intervalSeconds * 1000);
    return () => globalThis.clearInterval(intervalId);
  }, [autoRefresh, intervalSeconds, refresh]);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    writeBrowserSetting('analyticsAutoRefresh', String(enabled));
    updateAutoRefresh(enabled);
  }, []);

  const setIntervalSeconds = useCallback((seconds: AnalyticsRefreshInterval) => {
    writeBrowserSetting('analyticsRefreshInterval', String(seconds));
    updateIntervalSeconds(seconds);
  }, []);

  return {
    autoRefresh,
    intervalSeconds,
    initialLoading,
    refreshing,
    lastUpdated,
    setAutoRefresh,
    setIntervalSeconds,
    refreshNow: () => refresh(true),
  };
}
