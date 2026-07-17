import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateConversionEventRate,
  conversionAttributionAvailable,
  parseConversionInput,
} from './conversionPolicy.ts';

test('conversion input normalizes a client event id and currency', () => {
  assert.deepEqual(
    parseConversionInput({
      event_id: 'order:2026-0001',
      event_name: 'purchase.completed',
      value: '29.5',
      currency: 'usd',
      metadata: { plan: 'starter' },
    }),
    {
      value: {
        eventId: 'order:2026-0001',
        eventName: 'purchase.completed',
        value: 29.5,
        currency: 'USD',
        metadata: '{"plan":"starter"}',
      },
    }
  );
});

test('conversion input rejects unsafe ids and oversized metadata', () => {
  assert.match(parseConversionInput(null).error ?? '', /JSON object/);
  assert.match(parseConversionInput([]).error ?? '', /JSON object/);
  assert.match(parseConversionInput({ event_id: 'order id', event_name: 'purchase' }).error ?? '', /event_id/);
  assert.match(
    parseConversionInput({ event_name: 'purchase', metadata: 'x'.repeat(4001) }).error ?? '',
    /4000/
  );
});

test('conversion event rate excludes bot clicks and avoids unsupported attribution filters', () => {
  assert.equal(calculateConversionEventRate(12, 100, 20, true), 15);
  assert.equal(calculateConversionEventRate(0, 0, 0, true), 0);
  assert.equal(calculateConversionEventRate(12, 100, 20, false), null);
  assert.equal(conversionAttributionAvailable({ country: 'DE' }), false);
  assert.equal(conversionAttributionAvailable({}), true);
});
