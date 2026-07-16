export const TRAFFIC_ANOMALY_WINDOW_HOURS = 24;
export const TRAFFIC_ANOMALY_BASELINE_DAYS = 7;

export type TrafficAnomalyKind = 'volume_spike' | 'bot_rate_spike';
export type TrafficAnomalyOutcome = 'insufficient_data' | 'normal' | 'anomaly';

export interface TrafficAnomalyConfig {
  enabled: boolean;
  minimumVisits: number;
  volumeMultiplier: number;
  botRateDeltaPercentagePoints: number;
  suppressionMinutes: number;
}

export interface TrafficAnomalyMetrics {
  evaluatedAt: string;
  currentStart: string;
  baselineStart: string;
  currentVisits: number;
  currentBotVisits: number;
  baselineVisits: number;
  baselineBotVisits: number;
}

export interface TrafficAnomalySnapshot extends TrafficAnomalyMetrics {
  baselineDays: number;
  baselineAverageVisits: number;
  currentBotRate: number;
  baselineBotRate: number;
  volumeRatio: number;
  eligible: boolean;
  outcome: TrafficAnomalyOutcome;
}

export interface TrafficAnomalyState {
  active: TrafficAnomalyKind[];
  lastAlertAt?: string;
  lastRecoveryAt?: string;
  lastEvaluatedAt?: string;
  snapshot?: TrafficAnomalySnapshot;
}

export interface TrafficAnomalyEvidence {
  kind: TrafficAnomalyKind;
  current: number;
  baseline: number;
  threshold: number;
  change: number;
}

export interface TrafficAnomalyDecision {
  anomalies: TrafficAnomalyEvidence[];
  newlyActive: TrafficAnomalyKind[];
  recovered: TrafficAnomalyKind[];
  notifyAlert: boolean;
  notifyRecovery: boolean;
  nextState: TrafficAnomalyState;
}

export const DEFAULT_TRAFFIC_ANOMALY_CONFIG: TrafficAnomalyConfig = {
  enabled: false,
  minimumVisits: 50,
  volumeMultiplier: 2,
  botRateDeltaPercentagePoints: 25,
  suppressionMinutes: 1440,
};

const ANOMALY_KINDS = new Set<TrafficAnomalyKind>(['volume_spike', 'bot_rate_spike']);

export function parseTrafficAnomalyConfig(value?: string | null): TrafficAnomalyConfig {
  if (!value) return { ...DEFAULT_TRAFFIC_ANOMALY_CONFIG };
  try {
    return normalizeTrafficAnomalyConfig(JSON.parse(value) as Record<string, unknown>, false);
  } catch {
    return { ...DEFAULT_TRAFFIC_ANOMALY_CONFIG };
  }
}

export function validateTrafficAnomalyConfig(input: unknown): TrafficAnomalyConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Traffic anomaly configuration must be an object');
  }
  return normalizeTrafficAnomalyConfig(input as Record<string, unknown>, true);
}

export function parseTrafficAnomalyState(value?: string | null): TrafficAnomalyState {
  if (!value) return { active: [] };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      active: Array.isArray(parsed.active)
        ? [...new Set(parsed.active.filter(isTrafficAnomalyKind))]
        : [],
      ...(validTimestamp(parsed.lastAlertAt) ? { lastAlertAt: parsed.lastAlertAt } : {}),
      ...(validTimestamp(parsed.lastRecoveryAt) ? { lastRecoveryAt: parsed.lastRecoveryAt } : {}),
      ...(validTimestamp(parsed.lastEvaluatedAt)
        ? { lastEvaluatedAt: parsed.lastEvaluatedAt }
        : {}),
      ...(validSnapshot(parsed.snapshot) ? { snapshot: parsed.snapshot } : {}),
    };
  } catch {
    return { active: [] };
  }
}

export function evaluateTrafficAnomalies(
  metrics: TrafficAnomalyMetrics,
  config: TrafficAnomalyConfig,
  previous: TrafficAnomalyState
): TrafficAnomalyDecision {
  const snapshot = buildSnapshot(metrics, config);
  const anomalies = buildEvidence(snapshot, config);
  const active = anomalies.map((item) => item.kind);
  const previousActive = new Set(previous.active);
  const activeSet = new Set(active);
  const newlyActive = active.filter((kind) => !previousActive.has(kind));
  const recovered = previous.active.filter((kind) => !activeSet.has(kind));
  const suppressionElapsed = hasSuppressionElapsed(
    previous.lastAlertAt,
    metrics.evaluatedAt,
    config.suppressionMinutes
  );
  const notifyAlert = active.length > 0 && (newlyActive.length > 0 || suppressionElapsed);
  const notifyRecovery = recovered.length > 0;

  return {
    anomalies,
    newlyActive,
    recovered,
    notifyAlert,
    notifyRecovery,
    nextState: {
      active,
      ...(notifyAlert
        ? { lastAlertAt: metrics.evaluatedAt }
        : previous.lastAlertAt
          ? { lastAlertAt: previous.lastAlertAt }
          : {}),
      ...(notifyRecovery
        ? { lastRecoveryAt: metrics.evaluatedAt }
        : previous.lastRecoveryAt
          ? { lastRecoveryAt: previous.lastRecoveryAt }
          : {}),
      lastEvaluatedAt: metrics.evaluatedAt,
      snapshot,
    },
  };
}

function normalizeTrafficAnomalyConfig(
  input: Record<string, unknown>,
  strict: boolean
): TrafficAnomalyConfig {
  return {
    enabled: booleanValue(input.enabled, DEFAULT_TRAFFIC_ANOMALY_CONFIG.enabled, strict),
    minimumVisits: numberValue(
      input.minimumVisits,
      DEFAULT_TRAFFIC_ANOMALY_CONFIG.minimumVisits,
      10,
      100_000,
      'minimumVisits',
      strict,
      true
    ),
    volumeMultiplier: numberValue(
      input.volumeMultiplier,
      DEFAULT_TRAFFIC_ANOMALY_CONFIG.volumeMultiplier,
      1.25,
      10,
      'volumeMultiplier',
      strict
    ),
    botRateDeltaPercentagePoints: numberValue(
      input.botRateDeltaPercentagePoints,
      DEFAULT_TRAFFIC_ANOMALY_CONFIG.botRateDeltaPercentagePoints,
      5,
      100,
      'botRateDeltaPercentagePoints',
      strict
    ),
    suppressionMinutes: numberValue(
      input.suppressionMinutes,
      DEFAULT_TRAFFIC_ANOMALY_CONFIG.suppressionMinutes,
      0,
      10_080,
      'suppressionMinutes',
      strict,
      true
    ),
  };
}

function booleanValue(value: unknown, fallback: boolean, strict: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (strict) throw new Error('enabled must be true or false');
  return fallback;
}

function numberValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  name: string,
  strict: boolean,
  integer = false
): number {
  const parsed = typeof value === 'number' ? value : Number.NaN;
  const valid =
    Number.isFinite(parsed) &&
    parsed >= minimum &&
    parsed <= maximum &&
    (!integer || Number.isInteger(parsed));
  if (valid) return parsed;
  if (strict) {
    throw new Error(
      `${name} must be ${integer ? 'an integer ' : ''}between ${minimum} and ${maximum}`
    );
  }
  return fallback;
}

function buildSnapshot(
  metrics: TrafficAnomalyMetrics,
  config: TrafficAnomalyConfig
): TrafficAnomalySnapshot {
  const baselineAverageVisits = metrics.baselineVisits / TRAFFIC_ANOMALY_BASELINE_DAYS;
  const currentBotRate = rate(metrics.currentBotVisits, metrics.currentVisits);
  const baselineBotRate = rate(metrics.baselineBotVisits, metrics.baselineVisits);
  const volumeRatio = baselineAverageVisits > 0 ? metrics.currentVisits / baselineAverageVisits : 0;
  const eligible =
    metrics.currentVisits >= config.minimumVisits && baselineAverageVisits >= config.minimumVisits;
  const hasAnomaly =
    eligible &&
    (volumeRatio >= config.volumeMultiplier ||
      (currentBotRate - baselineBotRate) * 100 >= config.botRateDeltaPercentagePoints);

  return {
    ...metrics,
    baselineDays: TRAFFIC_ANOMALY_BASELINE_DAYS,
    baselineAverageVisits: round(baselineAverageVisits),
    currentBotRate: round(currentBotRate * 100),
    baselineBotRate: round(baselineBotRate * 100),
    volumeRatio: round(volumeRatio),
    eligible,
    outcome: !eligible ? 'insufficient_data' : hasAnomaly ? 'anomaly' : 'normal',
  };
}

function buildEvidence(
  snapshot: TrafficAnomalySnapshot,
  config: TrafficAnomalyConfig
): TrafficAnomalyEvidence[] {
  if (!snapshot.eligible) return [];
  const evidence: TrafficAnomalyEvidence[] = [];
  const baselineAverageVisits = snapshot.baselineVisits / TRAFFIC_ANOMALY_BASELINE_DAYS;
  const volumeRatio =
    baselineAverageVisits > 0 ? snapshot.currentVisits / baselineAverageVisits : 0;
  if (volumeRatio >= config.volumeMultiplier) {
    evidence.push({
      kind: 'volume_spike',
      current: snapshot.currentVisits,
      baseline: snapshot.baselineAverageVisits,
      threshold: config.volumeMultiplier,
      change: round(volumeRatio),
    });
  }
  const botRateDelta =
    (rate(snapshot.currentBotVisits, snapshot.currentVisits) -
      rate(snapshot.baselineBotVisits, snapshot.baselineVisits)) *
    100;
  if (botRateDelta >= config.botRateDeltaPercentagePoints) {
    evidence.push({
      kind: 'bot_rate_spike',
      current: snapshot.currentBotRate,
      baseline: snapshot.baselineBotRate,
      threshold: config.botRateDeltaPercentagePoints,
      change: round(botRateDelta),
    });
  }
  return evidence;
}

function hasSuppressionElapsed(
  previousAlertAt: string | undefined,
  evaluatedAt: string,
  suppressionMinutes: number
): boolean {
  if (!previousAlertAt || suppressionMinutes === 0) return true;
  const previous = Date.parse(previousAlertAt);
  const current = Date.parse(evaluatedAt);
  return Number.isFinite(previous) && Number.isFinite(current)
    ? current - previous >= suppressionMinutes * 60_000
    : true;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function validSnapshot(value: unknown): value is TrafficAnomalySnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    validTimestamp(item.evaluatedAt) &&
    validTimestamp(item.currentStart) &&
    validTimestamp(item.baselineStart) &&
    typeof item.currentVisits === 'number' &&
    typeof item.currentBotVisits === 'number' &&
    typeof item.baselineVisits === 'number' &&
    typeof item.baselineBotVisits === 'number' &&
    typeof item.baselineAverageVisits === 'number' &&
    typeof item.currentBotRate === 'number' &&
    typeof item.baselineBotRate === 'number' &&
    typeof item.volumeRatio === 'number' &&
    typeof item.eligible === 'boolean' &&
    (item.outcome === 'insufficient_data' ||
      item.outcome === 'normal' ||
      item.outcome === 'anomaly')
  );
}

function isTrafficAnomalyKind(value: unknown): value is TrafficAnomalyKind {
  return typeof value === 'string' && ANOMALY_KINDS.has(value as TrafficAnomalyKind);
}

function rate(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
