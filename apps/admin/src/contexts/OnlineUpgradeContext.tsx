import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UpdateCheckResult } from '../api/updates';
import {
  fetchRuntimeVersion,
  getOnlineUpgradeCapability,
  getOnlineUpgradeRun,
  startOnlineUpgrade,
  type OnlineUpgradeCapability,
} from '../api/onlineUpgrade';
import { isAdminReleaseReady } from '../api/adminRelease.ts';
import { useUpgradeFeedback } from '../hooks/useUpgradeFeedback.ts';
import { SUCCESS_RELOAD_DELAY_MS } from '../hooks/useUpgradeReload.ts';
import { waitForOnlineUpgrade, type OnlineUpgradePhase } from '../utils/onlineUpgrade';
import { useLocale } from './LocaleContext';
import { useUpdateCheckContext } from './UpdateCheckContext';
import { useToast } from '../components/ui/Toast';

export type OnlineUpgradeViewPhase =
  'idle' | 'confirming' | 'starting' | OnlineUpgradePhase | 'success' | 'failed';

interface OnlineUpgradeContextValue {
  centerOpen: boolean;
  openCenter: () => void;
  closeCenter: () => void;
  capability: OnlineUpgradeCapability | null | undefined;
  capabilityLoading: boolean;
  refreshCapability: () => Promise<OnlineUpgradeCapability | null>;
  automaticCapability: OnlineUpgradeCapability | null | undefined;
  availableUpdate: UpdateCheckResult | null;
  phase: OnlineUpgradeViewPhase;
  busy: boolean;
  error: string | null;
  runUrl: string | null;
  requestUpgrade: () => void;
  cancelConfirmation: () => void;
  confirmUpgrade: () => Promise<void>;
  resetFailure: () => void;
  feedback: ReturnType<typeof useUpgradeFeedback>['feedback'];
  feedbackCompleted: boolean;
  feedbackAutoRefreshing: boolean;
  dismissFeedback: () => void;
  reloadNow: () => void;
}

const OnlineUpgradeContext = createContext<OnlineUpgradeContextValue | null>(null);

export function OnlineUpgradeProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const toast = useToast();
  const updateCheck = useUpdateCheckContext();
  const [centerOpen, setCenterOpen] = useState(false);
  const [capability, setCapability] = useState<OnlineUpgradeCapability | null | undefined>();
  const [capabilityLoading, setCapabilityLoading] = useState(true);
  const [phase, setPhase] = useState<OnlineUpgradeViewPhase>('idle');
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const targetVersionRef = useRef<string | null>(null);
  const capabilityRequestRef = useRef<Promise<OnlineUpgradeCapability | null> | null>(null);
  const {
    feedback,
    completed: feedbackCompleted,
    autoRefreshing: feedbackAutoRefreshing,
    dismiss: dismissFeedback,
    reloadNow,
    rememberSuccessfulDeployment,
    scheduleReload,
  } = useUpgradeFeedback();
  const availableUpdate = updateCheck.result?.updateAvailable ? updateCheck.result : null;

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const refreshCapability = useCallback(() => {
    if (capabilityRequestRef.current) return capabilityRequestRef.current;
    setCapabilityLoading(true);
    const request = getOnlineUpgradeCapability()
      .then((nextCapability) => {
        if (activeRef.current) setCapability(nextCapability);
        return nextCapability;
      })
      .catch(() => {
        if (activeRef.current) setCapability(null);
        return null;
      })
      .finally(() => {
        capabilityRequestRef.current = null;
        if (activeRef.current) setCapabilityLoading(false);
      });
    capabilityRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void refreshCapability();
  }, [refreshCapability]);

  useEffect(() => {
    if (feedbackCompleted) dismissFeedback();
  }, [dismissFeedback, feedbackCompleted]);

  useEffect(() => {
    const nextTargetVersion = availableUpdate?.latestVersion ?? null;
    if (targetVersionRef.current === nextTargetVersion) return;
    targetVersionRef.current = nextTargetVersion;
    setPhase('idle');
    setRunUrl(null);
    setError(null);
  }, [availableUpdate?.latestVersion]);

  const automaticCapability = useMemo(() => {
    if (capability === undefined) return undefined;
    if (
      capability?.enabled &&
      availableUpdate &&
      capability.repositoryUrl === availableUpdate.repositoryUrl &&
      capability.branch === availableUpdate.branch
    ) {
      return capability;
    }
    return null;
  }, [availableUpdate, capability]);

  const busy = ['starting', 'queued', 'running', 'finalizing', 'success'].includes(phase);

  const openCenter = useCallback(() => {
    setCenterOpen(true);
    if (!busy) {
      void Promise.allSettled([updateCheck.checkNow({ forceRefresh: true }), refreshCapability()]);
    }
  }, [busy, refreshCapability, updateCheck]);

  const closeCenter = useCallback(() => {
    setCenterOpen(false);
    setPhase((current) => (current === 'confirming' ? 'idle' : current));
  }, []);

  const requestUpgrade = useCallback(() => {
    setCenterOpen(true);
    if (!availableUpdate) return;
    if (automaticCapability?.enabled) {
      setPhase('confirming');
      setError(null);
      return;
    }
    if (!capabilityLoading) toast.warning(t('upgradeCapabilityUnavailable'));
  }, [automaticCapability, availableUpdate, capabilityLoading, t, toast]);

  const cancelConfirmation = useCallback(() => {
    setPhase('idle');
    setError(null);
  }, []);

  const confirmUpgrade = useCallback(async () => {
    if (!automaticCapability?.enabled || !availableUpdate || phase !== 'confirming') return;
    setPhase('starting');
    setError(null);
    setRunUrl(null);

    try {
      const dispatch = await startOnlineUpgrade();
      if (!activeRef.current) return;
      setRunUrl(dispatch.runUrl);
      const result = await waitForOnlineUpgrade({
        targetVersion: availableUpdate.latestVersion,
        runId: dispatch.runId,
        readRun: getOnlineUpgradeRun,
        readRuntimeVersion: fetchRuntimeVersion,
        readAdminReady: () => isAdminReleaseReady(availableUpdate.latestVersion),
        onPhase: (nextPhase) => {
          if (activeRef.current) setPhase(nextPhase);
        },
        shouldContinue: () => activeRef.current,
      });
      if (!activeRef.current || result.outcome === 'cancelled') return;
      if (result.outcome === 'success') {
        rememberSuccessfulDeployment(availableUpdate.latestVersion);
        setPhase('success');
        toast.success(t('upgradeSucceeded'));
        scheduleReload(SUCCESS_RELOAD_DELAY_MS);
        return;
      }

      const failureMessage =
        result.outcome === 'timeout'
          ? t('upgradeTimeout')
          : result.outcome === 'verification_failed'
            ? t('upgradeVerificationFailed')
            : t('upgradeFailed', { conclusion: result.conclusion ?? 'unknown' });
      setPhase('failed');
      setError(failureMessage);
      if (result.outcome === 'verification_failed') toast.warning(failureMessage);
      else toast.error(failureMessage);
    } catch (upgradeError) {
      if (!activeRef.current) return;
      const failureMessage =
        upgradeError instanceof Error ? upgradeError.message : t('upgradeFailedGeneric');
      setPhase('failed');
      setError(failureMessage);
      toast.error(failureMessage);
    }
  }, [
    automaticCapability,
    availableUpdate,
    phase,
    rememberSuccessfulDeployment,
    scheduleReload,
    t,
    toast,
  ]);

  const resetFailure = useCallback(() => {
    setPhase('idle');
    setError(null);
    setRunUrl(null);
  }, []);

  const value = useMemo<OnlineUpgradeContextValue>(
    () => ({
      centerOpen,
      openCenter,
      closeCenter,
      capability,
      capabilityLoading,
      refreshCapability,
      automaticCapability,
      availableUpdate,
      phase,
      busy,
      error,
      runUrl,
      requestUpgrade,
      cancelConfirmation,
      confirmUpgrade,
      resetFailure,
      feedback,
      feedbackCompleted,
      feedbackAutoRefreshing,
      dismissFeedback,
      reloadNow,
    }),
    [
      automaticCapability,
      availableUpdate,
      busy,
      cancelConfirmation,
      capability,
      capabilityLoading,
      centerOpen,
      closeCenter,
      confirmUpgrade,
      error,
      openCenter,
      phase,
      refreshCapability,
      requestUpgrade,
      resetFailure,
      runUrl,
      dismissFeedback,
      feedback,
      feedbackAutoRefreshing,
      feedbackCompleted,
      reloadNow,
    ]
  );

  return <OnlineUpgradeContext.Provider value={value}>{children}</OnlineUpgradeContext.Provider>;
}

export function useOnlineUpgradeContext() {
  const context = useContext(OnlineUpgradeContext);
  if (!context) {
    throw new Error('useOnlineUpgradeContext must be used within OnlineUpgradeProvider');
  }
  return context;
}
