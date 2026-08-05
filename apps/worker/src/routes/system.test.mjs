import assert from 'node:assert/strict';
import test from 'node:test';
import { readExpectedUpgradeVersion } from './systemRequest.ts';

test('upgrade rejects non-object JSON bodies without throwing', () => {
  assert.equal(readExpectedUpgradeVersion(null), null);
  assert.equal(readExpectedUpgradeVersion([]), null);
  assert.equal(readExpectedUpgradeVersion('0.30.7'), null);
  assert.equal(readExpectedUpgradeVersion({}), null);
  assert.equal(readExpectedUpgradeVersion({ expectedVersion: 307 }), null);
  assert.equal(readExpectedUpgradeVersion({ expectedVersion: '0.30.7' }), '0.30.7');
});
