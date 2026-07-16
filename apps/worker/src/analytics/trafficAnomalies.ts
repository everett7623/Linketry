import type { Env } from '../types';
import { getSettings, setSetting } from '../db/index';
import { getTrafficAnomalyMetrics } from '../db/analytics';
import { now } from '../utils/id';
import { emitTrafficAnomalyNotifications } from '../notifications/index';
import {
  evaluateTrafficAnomalies,
  parseTrafficAnomalyConfig,
  parseTrafficAnomalyState,
  validateTrafficAnomalyConfig,
  type TrafficAnomalyConfig,
  type TrafficAnomalyDecision,
} from './trafficAnomalyPolicy';

const CONFIG_KEY = 'traffic_anomaly_config';
const STATE_KEY = 'traffic_anomaly_state';

export async function getTrafficAnomalyStatus(env: Env) {
  const settings = await getSettings(env);
  return {
    config: parseTrafficAnomalyConfig(settings[CONFIG_KEY]),
    state: parseTrafficAnomalyState(settings[STATE_KEY]),
  };
}

export async function saveTrafficAnomalyConfig(
  env: Env,
  input: unknown
): Promise<TrafficAnomalyConfig> {
  const config = validateTrafficAnomalyConfig(input);
  const updatedAt = now();
  const updates = [setSetting(env, CONFIG_KEY, JSON.stringify(config), updatedAt)];

  if (!config.enabled) {
    const settings = await getSettings(env);
    const state = parseTrafficAnomalyState(settings[STATE_KEY]);
    updates.push(setSetting(env, STATE_KEY, JSON.stringify({ ...state, active: [] }), updatedAt));
  }

  await Promise.all(updates);
  return config;
}

export async function runScheduledTrafficAnomalyCheck(
  env: Env
): Promise<TrafficAnomalyDecision | null> {
  const status = await getTrafficAnomalyStatus(env);
  if (!status.config.enabled) return null;

  const evaluatedAt = now();
  const metrics = await getTrafficAnomalyMetrics(env, evaluatedAt);
  const decision = evaluateTrafficAnomalies(metrics, status.config, status.state);
  await setSetting(env, STATE_KEY, JSON.stringify(decision.nextState), evaluatedAt);

  const data = {
    evaluated_at: evaluatedAt,
    anomalies: decision.anomalies,
    recovered: decision.recovered,
    snapshot: decision.nextState.snapshot,
  };
  if (decision.notifyAlert) {
    await emitTrafficAnomalyNotifications(env, 'traffic_anomaly.detected', data);
  }
  if (decision.notifyRecovery) {
    await emitTrafficAnomalyNotifications(env, 'traffic_anomaly.recovered', data);
  }

  return decision;
}
