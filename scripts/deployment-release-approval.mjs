import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const SHA_PATTERN = /^[a-f0-9]{40}$/i;

function readEnv(env, key) {
  return String(env[key] ?? '').trim();
}

function packageVersion() {
  const packageJson = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return String(packageJson.version ?? '').trim();
}

export function resolveManualReleaseApproval({
  env = process.env,
  version = packageVersion(),
} = {}) {
  if (readEnv(env, 'GITHUB_EVENT_NAME') !== 'workflow_dispatch') {
    return { mode: 'repository-variables' };
  }

  if (readEnv(env, 'LINKETRY_MANUAL_RELEASE_APPROVED').toLowerCase() !== 'true') {
    throw new Error('Manual deployment requires the release safety confirmation checkbox.');
  }

  const commit = readEnv(env, 'GITHUB_SHA').toLowerCase();
  const actor = readEnv(env, 'GITHUB_ACTOR');
  const expectedRelease = readEnv(env, 'LINKETRY_EXPECTED_RELEASE');
  const expectedCommit = readEnv(env, 'LINKETRY_EXPECTED_COMMIT').toLowerCase();
  if (!version)
    throw new Error('Manual deployment could not resolve the Linketry package version.');
  if (!SHA_PATTERN.test(commit))
    throw new Error('Manual deployment requires an exact GitHub commit SHA.');
  if (!actor) throw new Error('Manual deployment requires an authenticated GitHub actor.');
  if (Boolean(expectedRelease) !== Boolean(expectedCommit)) {
    throw new Error('Expected release and commit must be provided together.');
  }
  if (expectedRelease && expectedRelease !== version) {
    throw new Error(`Expected release ${expectedRelease} does not match package version ${version}.`);
  }
  if (expectedCommit && (!SHA_PATTERN.test(expectedCommit) || expectedCommit !== commit)) {
    throw new Error('Expected commit does not match GITHUB_SHA for this deployment.');
  }

  return {
    mode: 'workflow-dispatch',
    approvedRelease: version,
    approvedCommit: commit,
    actor,
  };
}

export function writeManualReleaseApproval(approval, environmentFile) {
  if (approval.mode !== 'workflow-dispatch') return;
  if (!environmentFile) throw new Error('GitHub Actions environment file is unavailable.');
  appendFileSync(
    environmentFile,
    `LINKETRY_APPROVED_RELEASE=${approval.approvedRelease}\n` +
      `LINKETRY_APPROVED_COMMIT=${approval.approvedCommit}\n`,
    'utf8'
  );
}

function main() {
  const approval = resolveManualReleaseApproval();
  writeManualReleaseApproval(approval, process.env.GITHUB_ENV);
  if (approval.mode === 'workflow-dispatch') {
    console.log(
      `Authenticated workflow dispatch by ${approval.actor} approved Linketry ${approval.approvedRelease} at ${approval.approvedCommit}.`
    );
  } else {
    console.log('Push deployment will use the exact repository release and commit approvals.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
