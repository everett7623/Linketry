import { useCallback, useEffect, useRef, useState } from 'react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { checkForUpdates, type UpdateCheckResult } from '../api/updates';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';
import { UPDATE_CHECK_CACHE_TTL_MS } from '../utils/versionCheck';

interface CheckOptions {
  forceRefresh?: boolean;
  revealDismissed?: boolean;
}

export function useUpdateCheck() {
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const activeRef = useRef(true);
  const lastCheckRef = useRef(0);

  const checkNow = useCallback(async (options: CheckOptions = {}) => {
    setChecking(true);
    try {
      const result = await checkForUpdates({
        currentVersion: LINKETRY_VERSION,
        forceRefresh: options.forceRefresh,
      });
      lastCheckRef.current = Date.now();
      if (!activeRef.current) return result;

      let dismissedVersion: string | null = null;
      try {
        dismissedVersion = readBrowserSetting('dismissedUpdateVersion');
      } catch {
        // The notice can still be shown when browser storage is unavailable.
      }

      if (
        result.updateAvailable &&
        (options.revealDismissed || dismissedVersion !== result.latestVersion)
      ) {
        setUpdate(result);
      } else {
        setUpdate(null);
      }
      return result;
    } finally {
      if (activeRef.current) setChecking(false);
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
    const runOptionalCheck = (options: CheckOptions = {}) => {
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

  return { update, checking, checkNow, dismiss };
}
