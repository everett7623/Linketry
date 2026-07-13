import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNotificationRequest, formatHealthNotification } from './policy.ts';

test('notification providers use their native text payloads', () => {
  assert.deepEqual(
    buildNotificationRequest('telegram', '123456:abcdefghijklmnopqrstuvwxyz', '-1001', 'alert'),
    {
      url: 'https://api.telegram.org/bot123456:abcdefghijklmnopqrstuvwxyz/sendMessage',
      body: { chat_id: '-1001', text: 'alert', disable_web_page_preview: true },
    }
  );
  assert.deepEqual(buildNotificationRequest('discord', 'https://discord.com/api/webhooks/1/token', '', 'alert').body, {
    content: 'alert',
    allowed_mentions: { parse: [] },
  });
  assert.deepEqual(buildNotificationRequest('slack', 'https://hooks.slack.com/services/a/b/c', '', 'alert').body, { text: 'alert' });
  assert.deepEqual(buildNotificationRequest('feishu', 'https://open.feishu.cn/open-apis/bot/v2/hook/key', '', 'alert').body, {
    msg_type: 'text',
    content: { text: 'alert' },
  });
  assert.deepEqual(buildNotificationRequest('dingtalk', 'https://oapi.dingtalk.com/robot/send?access_token=x', '', 'alert').body, {
    msgtype: 'text',
    text: { content: 'alert' },
  });
  assert.deepEqual(buildNotificationRequest('wecom', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=x', '', 'alert').body, {
    msgtype: 'text',
    text: { content: 'alert' },
  });
});

test('health notifications identify the original destination and status', () => {
  const message = formatHealthNotification('health_check.failed', {
    summary: {
      total: 2,
      warning: 1,
      broken: 1,
      items: [
        { slug: 'aff-one', url: 'https://merchant.example/aff', http_status: 404 },
        { slug: 'aff-two', url: 'https://merchant.example/down', http_status: null, error: 'Request timed out' },
      ],
    },
  });

  assert.match(message, /Linkora target alert/);
  assert.match(message, /\/aff-one — HTTP 404/);
  assert.match(message, /https:\/\/merchant\.example\/aff/);
  assert.match(message, /Request timed out/);
});
