import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForOnlineUpgrade } from './onlineUpgrade.ts';

const sleep = async () => {};
const run = (status: string, conclusion: string | null = null) => ({
  runId: 42,
  runUrl: 'https://github.com/owner/repo/actions/runs/42',
  status,
  conclusion,
  headSha: 'a'.repeat(40),
});

test('upgrade polling waits for a successful workflow and matching runtime version', async () => {
  const phases: string[] = [];
  const runs = [run('queued'), run('in_progress'), run('completed', 'success')];
  const versions = ['0.25.9', '0.25.10'];
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => runs.shift()!,
    readRuntimeVersion: async () => versions.shift()!,
    onPhase: (phase) => phases.push(phase),
    sleep,
  });

  assert.deepEqual(result, { outcome: 'success' });
  assert.deepEqual(phases, ['queued', 'running', 'finalizing']);
});

test('upgrade polling reports a failed workflow without claiming a new version', async () => {
  let runtimeChecks = 0;
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => run('completed', 'failure'),
    readRuntimeVersion: async () => {
      runtimeChecks += 1;
      return '0.25.10';
    },
    sleep,
  });

  assert.deepEqual(result, { outcome: 'failed', conclusion: 'failure' });
  assert.equal(runtimeChecks, 0);
});

test('upgrade polling fails when the workflow succeeds but runtime version stays stale', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => run('completed', 'success'),
    readRuntimeVersion: async () => '0.25.4',
    sleep,
    maxVersionPolls: 2,
  });
  assert.deepEqual(result, { outcome: 'timeout' });
});

test('upgrade polling can be cancelled without leaving a background timer', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: null,
    readRun: async () => run('queued'),
    readRuntimeVersion: async () => '0.25.4',
    shouldContinue: () => false,
    sleep,
  });
  assert.deepEqual(result, { outcome: 'cancelled' });
});
