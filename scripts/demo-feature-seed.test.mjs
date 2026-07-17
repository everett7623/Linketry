import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDemoFeatureSeedSql, buildDemoFeatureSettings } from './demo-feature-seed.mjs';

test('Demo advanced feature settings are deterministic and production-like', () => {
  const now = new Date('2026-07-17T12:00:00.000Z');
  const settings = buildDemoFeatureSettings(now);

  assert.equal(JSON.parse(settings.utm_templates).length, 2);
  assert.equal(Object.keys(JSON.parse(settings.link_notes)).length, 2);
  assert.equal(JSON.parse(settings.traffic_anomaly_config).enabled, true);
  assert.equal(JSON.parse(settings.traffic_anomaly_state).active[0], 'volume_spike');
  assert.equal(settings.admin_hidden_modules, '[]');
});

test('Demo delivery samples remain disabled and SQL upserts only settings', () => {
  const settings = buildDemoFeatureSettings(new Date('2026-07-17T12:00:00.000Z'));
  const notifications = JSON.parse(settings.notification_channels);
  assert.equal(notifications.telegram.enabled, false);
  assert.equal(notifications.discord.enabled, false);
  assert.equal(settings.webhook_enabled, 'false');

  const sql = buildDemoFeatureSeedSql({ now: new Date('2026-07-17T12:00:00.000Z') });
  assert.match(sql, /INSERT INTO settings/);
  assert.match(sql, /ON CONFLICT\(key\) DO UPDATE/);
  assert.match(sql, /utm_templates/);
  assert.match(sql, /notification_channels/);
  assert.doesNotMatch(sql, /INSERT INTO (?:links|visits|api_tokens)/);
});
