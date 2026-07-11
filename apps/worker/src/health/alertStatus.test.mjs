import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHealthAlertStatus } from './alertStatus.ts';

test('health alert status is sorted and tolerates deleted links', () => {
  const status = buildHealthAlertStatus(
    {
      failures: { missing: 3, link1: 1 },
      alerted: ['missing'],
      lastAlertAt: '2026-07-11T00:00:00.000Z',
    },
    [
      {
        id: 'link1',
        slug: 'docs',
        domain: 'go.example.com',
        fallback_url: 'https://example.com/fallback',
      },
    ]
  );

  assert.deepEqual(status.items.map((item) => item.link_id), ['missing', 'link1']);
  assert.equal(status.items[0].slug, null);
  assert.equal(status.items[0].alerted, true);
  assert.equal(status.items[1].fallback_url, 'https://example.com/fallback');
  assert.equal(status.last_alert_at, '2026-07-11T00:00:00.000Z');
  assert.equal('failures' in status, false);
});
