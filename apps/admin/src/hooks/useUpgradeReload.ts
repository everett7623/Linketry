import { useCallback, useEffect, useRef } from 'react';

export const SUCCESS_RELOAD_DELAY_MS = 800;
export const FINALIZING_RELOAD_DELAY_MS = 10_000;

export function useUpgradeReload() {
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    },
    []
  );

  return useCallback((delayMs: number) => {
    if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    timerRef.current = globalThis.setTimeout(() => {
      timerRef.current = null;
      window.location.reload();
    }, delayMs);
  }, []);
}
