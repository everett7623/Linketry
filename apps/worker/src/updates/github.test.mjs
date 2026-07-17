import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dispatchOnlineUpgrade,
  getOnlineUpgradeCapability,
  OnlineUpgradeError,
  readOnlineUpgradeRun,
} from './github.ts';

const configuredEnv = {
  LINKETRY_GITHUB_UPDATE_TOKEN: 'github-token',
  LINKETRY_UPDATE_REPOSITORY: 'owner/linketry-fork',
  LINKETRY_UPDATE_BRANCH: 'main',
};

test('online upgrade capability fails closed until repository and secret are configured', () => {
  assert.deepEqual(getOnlineUpgradeCapability({}), {
    enabled: false,
    repositoryUrl: null,
    workflowUrl: null,
    branch: 'main',
    reason: 'not_configured',
  });

  assert.deepEqual(getOnlineUpgradeCapability(configuredEnv), {
    enabled: true,
    repositoryUrl: 'https://github.com/owner/linketry-fork',
    workflowUrl: 'https://github.com/owner/linketry-fork/actions/workflows/deploy.yml',
    branch: 'main',
    reason: 'ready',
  });
});

test('online upgrade capability rejects unsafe repository and branch configuration', () => {
  const result = getOnlineUpgradeCapability({
    ...configuredEnv,
    LINKETRY_UPDATE_REPOSITORY: 'owner/linketry/extra',
    LINKETRY_UPDATE_BRANCH: '../main',
  });
  assert.equal(result.enabled, false);
  assert.equal(result.reason, 'invalid_configuration');
  assert.equal(result.repositoryUrl, null);
  assert.equal(result.branch, null);
});

test('dispatch uses only configured deployment targets and returns GitHub run details', async () => {
  let request;
  const result = await dispatchOnlineUpgrade(configuredEnv, async (input, init) => {
    request = { input: String(input), init };
    return Response.json({
      workflow_run_id: 12345,
      html_url: 'https://github.com/owner/linketry-fork/actions/runs/12345',
    });
  });

  assert.equal(
    request.input,
    'https://api.github.com/repos/owner/linketry-fork/actions/workflows/deploy.yml/dispatches'
  );
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers.Authorization, 'Bearer github-token');
  assert.deepEqual(JSON.parse(request.init.body), {
    ref: 'main',
    inputs: { confirm_release: true },
  });
  assert.deepEqual(result, {
    accepted: true,
    runId: 12345,
    runUrl: 'https://github.com/owner/linketry-fork/actions/runs/12345',
    status: 'queued',
  });
});

test('dispatch supports GitHub responses without immediate run details', async () => {
  const result = await dispatchOnlineUpgrade(configuredEnv, async () => {
    return new Response(null, { status: 204 });
  });
  assert.equal(result.runId, null);
  assert.equal(
    result.runUrl,
    'https://github.com/owner/linketry-fork/actions/workflows/deploy.yml'
  );
});

test('run status is validated and reduced to the public polling contract', async () => {
  const result = await readOnlineUpgradeRun(configuredEnv, 12345, async (input) => {
    assert.equal(
      String(input),
      'https://api.github.com/repos/owner/linketry-fork/actions/runs/12345'
    );
    return Response.json({
      id: 12345,
      html_url: 'https://github.com/owner/linketry-fork/actions/runs/12345',
      status: 'completed',
      conclusion: 'success',
      head_sha: 'a'.repeat(40),
    });
  });
  assert.deepEqual(result, {
    runId: 12345,
    runUrl: 'https://github.com/owner/linketry-fork/actions/runs/12345',
    status: 'completed',
    conclusion: 'success',
    headSha: 'a'.repeat(40),
  });
});

test('upgrade requests reject missing configuration and invalid run IDs', async () => {
  await assert.rejects(
    () => dispatchOnlineUpgrade({}),
    (error) => error instanceof OnlineUpgradeError && error.status === 503
  );
  await assert.rejects(
    () => readOnlineUpgradeRun(configuredEnv, 0),
    (error) => error instanceof OnlineUpgradeError && error.status === 400
  );
});
