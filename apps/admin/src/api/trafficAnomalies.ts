import { apiGet, apiPost, apiPut } from './client';

export type TrafficAnomalyKind = 'volume_spike' | 'bot_rate_spike';

export interface TrafficAnomalyConfig {
  enabled: boolean;
  minimumVisits: number;
  volumeMultiplier: number;
  botRateDeltaPercentagePoints: number;
  suppressionMinutes: number;
}

export interface TrafficAnomalySnapshot {
  evaluatedAt: string;
  currentStart: string;
  baselineStart: string;
  currentVisits: number;
  currentBotVisits: number;
  baselineVisits: number;
  baselineBotVisits: number;
  baselineDays: number;
  baselineAverageVisits: number;
  currentBotRate: number;
  baselineBotRate: number;
  volumeRatio: number;
  eligible: boolean;
  outcome: 'insufficient_data' | 'normal' | 'anomaly';
}

export interface TrafficAnomalyState {
  active: TrafficAnomalyKind[];
  lastAlertAt?: string;
  lastRecoveryAt?: string;
  lastEvaluatedAt?: string;
  snapshot?: TrafficAnomalySnapshot;
}

export interface TrafficAnomalyStatus {
  config: TrafficAnomalyConfig;
  state: TrafficAnomalyState;
}

interface TrafficAnomalyDecision {
  nextState: TrafficAnomalyState;
}

export function getTrafficAnomalyStatus(): Promise<TrafficAnomalyStatus> {
  return apiGet('/api/v1/analytics-alerts');
}

export function saveTrafficAnomalyConfig(
  config: TrafficAnomalyConfig
): Promise<TrafficAnomalyConfig> {
  return apiPut('/api/v1/analytics-alerts/config', config);
}

export function runTrafficAnomalyCheck(): Promise<TrafficAnomalyDecision> {
  return apiPost('/api/v1/analytics-alerts/run');
}
