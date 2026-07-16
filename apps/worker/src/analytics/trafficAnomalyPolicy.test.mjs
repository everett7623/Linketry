import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TRAFFIC_ANOMALY_CONFIG,
  evaluateTrafficAnomalies,
  parseTrafficAnomalyConfig,
  parseTrafficAnomalyState,
  validateTrafficAnomalyConfig,
} from './trafficAnomalyPolicy.ts';

const config = { ...DEFAULT_TRAFFIC_ANOMALY_CONFIG, enabled: true };

function metrics(overrides = {}) {
  return {
    evaluatedAt: '2026-07-16T00:00:00.000Z',
    currentStart: '2026-07-15T00:00:00.000Z',
    baselineStart: '2026-07-08T00:00:00.000Z',
    currentVisits: 120,
    currentBotVisits: 12,
    baselineVisits: 420,
    baselineBotVisits: 42,
    ...overrides,
  };
}

test('traffic anomaly configuration uses safe defaults and strict bounded validation', () => {
  assert.deepEqual(parseTrafficAnomalyConfig('invalid'), DEFAULT_TRAFFIC_ANOMALY_CONFIG);
  assert.equal(parseTrafficAnomalyConfig('{"minimumVisits":100}').minimumVisits, 100);
  assert.throws(
    () => validateTrafficAnomalyConfig({ ...config, minimumVisits: 1 }),
    /minimumVisits/
  );
  assert.throws(
    () => validateTrafficAnomalyConfig({ ...config, volumeMultiplier: 1 }),
    /volumeMultiplier/
  );
});

test('traffic anomaly state parsing keeps only bounded known aggregate state', () => {
  assert.deepEqual(parseTrafficAnomalyState('invalid'), { active: [] });
  assert.deepEqual(
    parseTrafficAnomalyState(
      JSON.stringify({ active: ['volume_spike', 'unknown', 'volume_spike'] })
    ),
    { active: ['volume_spike'] }
  );
});

test('volume and bot-rate spikes produce explainable evidence', () => {
  const decision = evaluateTrafficAnomalies(
    metrics({ currentVisits: 180, currentBotVisits: 108 }),
    config,
    { active: [] }
  );

  assert.deepEqual(decision.nextState.active, ['volume_spike', 'bot_rate_spike']);
  assert.deepEqual(decision.newlyActive, ['volume_spike', 'bot_rate_spike']);
  assert.equal(decision.notifyAlert, true);
  assert.equal(decision.nextState.snapshot?.baselineAverageVisits, 60);
  assert.equal(decision.nextState.snapshot?.volumeRatio, 3);
  assert.equal(decision.nextState.snapshot?.currentBotRate, 60);
  assert.equal(decision.nextState.snapshot?.baselineBotRate, 10);
});

test('minimum volume prevents low-sample false positives', () => {
  const decision = evaluateTrafficAnomalies(
    metrics({ currentVisits: 20, currentBotVisits: 20, baselineVisits: 35, baselineBotVisits: 0 }),
    config,
    { active: [] }
  );

  assert.equal(decision.nextState.snapshot?.outcome, 'insufficient_data');
  assert.deepEqual(decision.anomalies, []);
  assert.equal(decision.notifyAlert, false);
});

test('threshold decisions and evidence use the same unrounded aggregate ratios', () => {
  const decision = evaluateTrafficAnomalies(
    metrics({
      currentVisits: 100_000,
      currentBotVisits: 34_999,
      baselineVisits: 700_000,
      baselineBotVisits: 70_001,
    }),
    config,
    { active: [] }
  );

  assert.equal(decision.nextState.snapshot?.currentBotRate, 35);
  assert.equal(decision.nextState.snapshot?.baselineBotRate, 10);
  assert.deepEqual(decision.anomalies, []);
  assert.equal(decision.nextState.snapshot?.outcome, 'normal');
});

test('active anomalies are suppressed until the configured window elapses', () => {
  const active = evaluateTrafficAnomalies(metrics({ currentVisits: 180 }), config, {
    active: ['volume_spike'],
    lastAlertAt: '2026-07-15T12:00:00.000Z',
  });
  assert.equal(active.notifyAlert, false);

  const repeated = evaluateTrafficAnomalies(metrics({ currentVisits: 180 }), config, {
    active: ['volume_spike'],
    lastAlertAt: '2026-07-14T00:00:00.000Z',
  });
  assert.equal(repeated.notifyAlert, true);
});

test('returning to the baseline emits one recovery decision', () => {
  const decision = evaluateTrafficAnomalies(
    metrics({ currentVisits: 70, currentBotVisits: 7 }),
    config,
    {
      active: ['volume_spike'],
      lastAlertAt: '2026-07-15T00:00:00.000Z',
    }
  );

  assert.deepEqual(decision.recovered, ['volume_spike']);
  assert.equal(decision.notifyRecovery, true);
  assert.equal(decision.nextState.snapshot?.outcome, 'normal');
  assert.deepEqual(decision.nextState.active, []);
});
