import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyTopCountries, normalizeGeography } from './geography.ts';

test('geography normalizes ISO country codes and preserves unmapped traffic', () => {
  const geography = normalizeGeography([
    { country: 'us', clicks: 8 },
    { country: 'US', clicks: 2 },
    { country: 'DE', clicks: 4 },
    { country: 'XX', clicks: 3 },
    { country: 'Unknown', clicks: 1 },
  ]);

  assert.deepEqual(geography, {
    countries: [
      { country: 'US', clicks: 10 },
      { country: 'DE', clicks: 4 },
    ],
    mappedClicks: 14,
    unknownClicks: 4,
  });
  assert.deepEqual(legacyTopCountries(geography), [
    { country: 'US', clicks: 10 },
    { country: 'DE', clicks: 4 },
    { country: 'Unknown', clicks: 4 },
  ]);
});
