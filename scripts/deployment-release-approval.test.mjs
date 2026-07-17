import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  resolveManualReleaseApproval,
  writeManualReleaseApproval,
} from './deployment-release-approval.mjs';

const commit = 'a'.repeat(40);

test('push deployments retain repository-variable release approvals', () => {
  assert.deepEqual(
    resolveManualReleaseApproval({ env: { GITHUB_EVENT_NAME: 'push' }, version: '0.25.4' }),
    { mode: 'repository-variables' }
  );
});

test('authenticated manual confirmation approves only the selected version and commit', () => {
  assert.deepEqual(
    resolveManualReleaseApproval({
      version: '0.25.4',
      env: {
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_SHA: commit,
        GITHUB_ACTOR: 'everettlabs',
        LINKETRY_MANUAL_RELEASE_APPROVED: 'true',
      },
    }),
    {
      mode: 'workflow-dispatch',
      approvedRelease: '0.25.4',
      approvedCommit: commit,
      actor: 'everettlabs',
    }
  );
});

test('manual deployment fails closed without confirmation or authenticated run metadata', () => {
  const baseEnv = {
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_SHA: commit,
    GITHUB_ACTOR: 'everettlabs',
    LINKETRY_MANUAL_RELEASE_APPROVED: 'false',
  };

  assert.throws(
    () => resolveManualReleaseApproval({ env: baseEnv, version: '0.25.4' }),
    /confirmation checkbox/
  );
  assert.throws(
    () =>
      resolveManualReleaseApproval({
        env: { ...baseEnv, LINKETRY_MANUAL_RELEASE_APPROVED: 'true', GITHUB_ACTOR: '' },
        version: '0.25.4',
      }),
    /authenticated GitHub actor/
  );
});

test('manual approval writes only exact gate overrides to the GitHub environment file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'linketry-release-approval-'));
  const environmentFile = join(directory, 'github-env');
  try {
    writeManualReleaseApproval(
      {
        mode: 'workflow-dispatch',
        approvedRelease: '0.25.4',
        approvedCommit: commit,
        actor: 'everettlabs',
      },
      environmentFile
    );
    assert.equal(
      readFileSync(environmentFile, 'utf8'),
      `LINKETRY_APPROVED_RELEASE=0.25.4\nLINKETRY_APPROVED_COMMIT=${commit}\n`
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
