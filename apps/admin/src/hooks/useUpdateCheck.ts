import { useCallback, useEffect, useRef, useState } from 'react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { checkForUpdates, type UpdateCheckResult } from '../api/updates';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';
import { UPDATE_CHECK_CACHE_TTL_MS } from '../utils/versionCheck';

export interface UpdateCheckOptions {
  forceRefresh?: boolean;
  revealDismissed?: boolean;
}

export function useUpdateCheck() {
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const lastCheckRef = useRef(0);
  const pendingChecksRef = useRef(0);

  const checkNow = useCallback(async (options: UpdateCheckOptions = {}) => {
    pendingChecksRef.current += 1;
    setChecking(true);
    try {
      const nextResult = await checkForUpdates({
        currentVersion: LINKETRY_VERSION,
        forceRefresh: options.forceRefresh,
      });
      lastCheckRef.current = nextResult.checkedAt;
      if (!activeRef.current) return nextResult;
      setResult(nextResult);
      setCheckError(null);

      let dismissedVersion: string | null = null;
      try {
        dismissedVersion = readBrowserSetting('dismissedUpdateVersion');
      } catch {
        // The notice can still be shown when browser storage is unavailable.
      }

      if (
        nextResult.updateAvailable &&
        (options.revealDismissed || dismissedVersion !== nextResult.latestVersion)
      ) {
        setUpdate(nextResult);
      } else {
        setUpdate(null);
      }
      return nextResult;
    } catch (error) {
      if (activeRef.current) {
        setCheckError(error instanceof Error ? error.message : 'Update check failed.');
      }
      throw error;
    } finally {
      pendingChecksRef.current = Math.max(0, pendingChecksRef.current - 1);
      if (activeRef.current) setChecking(pendingChecksRef.current > 0);
    }
  }, []);

  const dismiss = useCallback(() => {
    setUpdate((current) => {
      if (current) {
        try {
          writeBrowserSetting('dismissedUpdateVersion', current.latestVersion);
        } catch {
          // Dismiss for the current render even when persistence is unavailable.
        }
      }
      return null;
    });
  }, []);

  useEffect(() => {
    activeRef.current = true;
    const runOptionalCheck = (options: UpdateCheckOptions = {}) => {
      void checkNow(options).catch(() => {
        // Automatic update discovery must never interrupt the Admin shell.
      });
    };
    runOptionalCheck();

    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState === 'visible') runOptionalCheck({ forceRefresh: true });
    }, UPDATE_CHECK_CACHE_TTL_MS);
    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastCheckRef.current >= UPDATE_CHECK_CACHE_TTL_MS
      ) {
        runOptionalCheck({ forceRefresh: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      activeRef.current = false;
      globalThis.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkNow]);

  return { result, update, checking, checkError, checkNow, dismiss };
}
