import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildNotificationRequest,
  formatHealthNotification,
  formatTrafficAnomalyNotification,
} from './policy.ts';

test('notification providers use their native text payloads', () => {
  assert.deepEqual(
    buildNotificationRequest('telegram', '123456:abcdefghijklmnopqrstuvwxyz', '-1001', 'alert'),
    {
      url: 'https://api.telegram.org/bot123456:abcdefghijklmnopqrstuvwxyz/sendMessage',
      body: { chat_id: '-1001', text: 'alert', disable_web_page_preview: true },
    }
  );
  assert.deepEqual(
    buildNotificationRequest('discord', 'https://discord.com/api/webhooks/1/token', '', 'alert')
      .body,
    {
      content: 'alert',
      allowed_mentions: { parse: [] },
    }
  );
  assert.deepEqual(
    buildNotificationRequest('slack', 'https://hooks.slack.com/services/a/b/c', '', 'alert').body,
    { text: 'alert' }
  );
  assert.deepEqual(
    buildNotificationRequest(
      'feishu',
      'https://open.feishu.cn/open-apis/bot/v2/hook/key',
      '',
      'alert'
    ).body,
    {
      msg_type: 'text',
      content: { text: 'alert' },
    }
  );
  assert.deepEqual(
    buildNotificationRequest(
      'dingtalk',
      'https://oapi.dingtalk.com/robot/send?access_token=x',
      '',
      'alert'
    ).body,
    {
      msgtype: 'text',
      text: { content: 'alert' },
    }
  );
  assert.deepEqual(
    buildNotificationRequest(
      'wecom',
      'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=x',
      '',
      'alert'
    ).body,
    {
      msgtype: 'text',
      text: { content: 'alert' },
    }
  );
});

test('health notifications identify the original destination and status', () => {
  const message = formatHealthNotification('health_check.failed', {
    summary: {
      total: 2,
      warning: 1,
      broken: 1,
      items: [
        {
          slug: 'aff-one',
          domain: 'go.example.com',
          url: 'https://merchant.example/aff',
          status: 'warning',
          http_status: 404,
          response_time_ms: 128,
          checked_at: '2026-07-14T06:28:10.000Z',
        },
        {
          slug: 'aff-two',
          url: 'https://merchant.example/down',
          status: 'broken',
          http_status: null,
          response_time_ms: 8001,
          checked_at: '2026-07-14T06:28:11.000Z',
          error: 'Request timed out',
        },
      ],
    },
  });

  assert.match(message, /⚠️ Linketry Link Alert/);
  assert.match(message, /Affected Links: 2/);
  assert.match(message, /Checked: 2 \| Warning: 1 \| Broken: 1/);
  assert.match(message, /Short Link: https:\/\/go\.example\.com\/aff-one/);
  assert.match(message, /Target URL: https:\/\/merchant\.example\/aff/);
  assert.match(message, /Status: Target Warning/);
  assert.match(message, /HTTP Status: 404/);
  assert.match(message, /Response Time: 128 ms/);
  assert.match(message, /Detected At: 2026-07-14 06:28:10 UTC/);
  assert.match(message, /Status: Target Offline/);
  assert.match(message, /HTTP Status: N\/A/);
  assert.match(message, /Error: Request timed out/);
  assert.match(message, /Please check the target URL or redirect configuration\./);
});

test('health recovery notifications use the complete default format', () => {
  const message = formatHealthNotification('health_check.recovered', {
    recovered: ['link-one'],
    items: [
      {
        link_id: 'link-one',
        slug: 'demo',
        domain: 'go.example.com',
        url: 'https://example.com/page',
        status: 'healthy',
        http_status: 200,
        response_time_ms: 84,
        checked_at: '2026-07-14T06:30:25.000Z',
      },
    ],
  });

  assert.match(message, /✅ Linketry Link Recovered/);
  assert.match(message, /Recovered Links: 1/);
  assert.match(message, /Short Link: https:\/\/go\.example\.com\/demo/);
  assert.match(message, /Target URL: https:\/\/example\.com\/page/);
  assert.match(message, /Status: Online/);
  assert.match(message, /HTTP Status: 200/);
  assert.match(message, /Response Time: 84 ms/);
  assert.match(message, /Detected At: 2026-07-14 06:30:25 UTC/);
  assert.match(message, /The target URL has returned to normal\./);
});

test('traffic anomaly notifications explain aggregate thresholds without visitor identifiers', () => {
  const message = formatTrafficAnomalyNotification('traffic_anomaly.detected', {
    anomalies: [
      { kind: 'volume_spike', change: 3, threshold: 2 },
      { kind: 'bot_rate_spike', change: 40, threshold: 25 },
    ],
    snapshot: {
      currentStart: '2026-07-15T00:00:00.000Z',
      evaluatedAt: '2026-07-16T00:00:00.000Z',
      currentVisits: 180,
      baselineAverageVisits: 60,
      currentBotRate: 50,
      baselineBotRate: 10,
    },
  });

  assert.match(message, /Visits: 180 \| 7-day daily baseline: 60/);
  assert.match(message, /Volume spike: 3x baseline \(threshold 2x\)/);
  assert.match(message, /Bot-rate spike: \+40 percentage points \(threshold \+25\)/);
  assert.match(message, /No visitor identifiers are included/);
  assert.doesNotMatch(message, /ip_hash|user_agent|session/i);
});

test('traffic anomaly recovery names the aggregate signals that recovered', () => {
  const message = formatTrafficAnomalyNotification('traffic_anomaly.recovered', {
    recovered: ['volume_spike', 'bot_rate_spike'],
    snapshot: {
      currentStart: '2026-07-15T00:00:00.000Z',
      evaluatedAt: '2026-07-16T00:00:00.000Z',
      currentVisits: 70,
      baselineAverageVisits: 60,
      currentBotRate: 12,
      baselineBotRate: 10,
    },
  });

  assert.match(message, /Recovered signals: volume, bot rate/);
  assert.match(message, /returned within the configured thresholds/);
});
