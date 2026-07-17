import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicDemoBuild, isReadOnlyRequest, isValidDemoAccessCode } from './demoMode.ts';

test('public Demo build requires an explicit true flag', () => {
  assert.equal(isPublicDemoBuild('true'), true);
  assert.equal(isPublicDemoBuild(' TRUE '), true);
  assert.equal(isPublicDemoBuild('read-only'), false);
  assert.equal(isPublicDemoBuild(undefined), false);
});

test('public Demo browser requests allow reads and reject writes', () => {
  assert.equal(isReadOnlyRequest(), true);
  assert.equal(isReadOnlyRequest('GET'), true);
  assert.equal(isReadOnlyRequest('head'), true);
  assert.equal(isReadOnlyRequest('OPTIONS'), true);
  assert.equal(isReadOnlyRequest('POST'), false);
  assert.equal(isReadOnlyRequest('PUT'), false);
  assert.equal(isReadOnlyRequest('DELETE'), false);
});

test('Demo preview code matches exactly and never accepts an empty configuration', () => {
  assert.equal(isValidDemoAccessCode('LinketryDemo', 'LinketryDemo'), true);
  assert.equal(isValidDemoAccessCode('linketrydemo', 'LinketryDemo'), false);
  assert.equal(isValidDemoAccessCode('', ''), false);
});
