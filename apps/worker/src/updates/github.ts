import type { Env } from '../types';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const DEPLOY_WORKFLOW = 'deploy.yml';
const REQUEST_TIMEOUT_MS = 10_000;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_PATTERN = /^[A-Za-z0-9._/-]+$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/i;
const VERSION_PATTERN = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface OnlineUpgradeCapability {
  enabled: boolean;
  repositoryUrl: string | null;
  workflowUrl: string | null;
  branch: string | null;
  reason: 'ready' | 'not_configured' | 'invalid_configuration';
}

export interface OnlineUpgradeDispatch {
  accepted: true;
  runId: number | null;
  runUrl: string;
  status: string;
}

export interface OnlineUpgradeRun {
  runId: number;
  runUrl: string;
  status: string;
  conclusion: string | null;
  headSha: string | null;
}

interface UpgradeConfig {
  repository: string;
  branch: string;
  token: string;
  repositoryUrl: string;
  workflowUrl: string;
}

interface DeploymentTarget {
  commit: string;
  version: string;
}

export class OnlineUpgradeError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OnlineUpgradeError';
    this.status = status;
  }
}

export function getOnlineUpgradeCapability(env: Env): OnlineUpgradeCapability {
  const repository = env.LINKETRY_UPDATE_REPOSITORY?.trim() ?? '';
  const branch = env.LINKETRY_UPDATE_BRANCH?.trim() || 'main';
  const token = env.LINKETRY_GITHUB_UPDATE_TOKEN?.trim() ?? '';
  const repositoryValid = isRepository(repository);
  const branchValid = isBranch(branch);
  const repositoryUrl = repositoryValid ? `https://github.com/${repository}` : null;

  if (!repository || !token) {
    return {
      enabled: false,
      repositoryUrl,
      workflowUrl: repositoryUrl ? `${repositoryUrl}/actions/workflows/${DEPLOY_WORKFLOW}` : null,
      branch: branchValid ? branch : null,
      reason: 'not_configured',
    };
  }

  if (!repositoryValid || !branchValid) {
    return {
      enabled: false,
      repositoryUrl,
      workflowUrl: null,
      branch: branchValid ? branch : null,
      reason: 'invalid_configuration',
    };
  }

  return {
    enabled: true,
    repositoryUrl,
    workflowUrl: `${repositoryUrl}/actions/workflows/${DEPLOY_WORKFLOW}`,
    branch,
    reason: 'ready',
  };
}

export async function dispatchOnlineUpgrade(
  env: Env,
  expectedVersion: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<OnlineUpgradeDispatch> {
  const config = resolveConfig(env);
  const normalizedExpectedVersion = normalizeReleaseVersion(expectedVersion);
  if (!normalizedExpectedVersion) {
    throw new OnlineUpgradeError('Online upgrade requires a valid expected version.', 400);
  }
  const target = await readDeploymentTarget(config, fetcher);
  if (target.version !== normalizedExpectedVersion) {
    throw new OnlineUpgradeError(
      `Configured branch now advertises Linketry ${target.version}; refresh before upgrading.`,
      409
    );
  }
  const response = await githubFetch(
    `${workflowApiUrl(config)}/dispatches`,
    config.token,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: config.branch,
        inputs: {
          confirm_release: 'true',
          expected_release: target.version,
          expected_commit: target.commit,
        },
      }),
    },
    fetcher
  );

  if (response.status === 204) {
    return {
      accepted: true,
      runId: null,
      runUrl: config.workflowUrl,
      status: 'queued',
    };
  }
  if (!response.ok) throw githubError('dispatch', response.status);

  const body = (await response.json()) as unknown;
  const record = isRecord(body) ? body : {};
  const runId = positiveInteger(record.workflow_run_id);
  if (runId === null) throw new OnlineUpgradeError('GitHub returned an invalid workflow run.', 502);

  return {
    accepted: true,
    runId,
    runUrl: safeRunUrl(record.html_url, config, runId),
    status: 'queued',
  };
}

async function readDeploymentTarget(
  config: UpgradeConfig,
  fetcher: Fetcher
): Promise<DeploymentTarget> {
  const commitResponse = await githubFetch(
    `${GITHUB_API_URL}/repos/${config.repository}/commits/${encodeURIComponent(config.branch)}`,
    config.token,
    {},
    fetcher
  );
  if (!commitResponse.ok) throw githubError('target commit lookup', commitResponse.status);

  const commitBody = (await commitResponse.json()) as unknown;
  const commit = stringValue(isRecord(commitBody) ? commitBody.sha : null)?.toLowerCase() ?? '';
  if (!COMMIT_PATTERN.test(commit)) {
    throw new OnlineUpgradeError('GitHub returned an invalid deployment commit.', 502);
  }

  const packageResponse = await githubFetch(
    `${GITHUB_API_URL}/repos/${config.repository}/contents/package.json?ref=${encodeURIComponent(commit)}`,
    config.token,
    { headers: { Accept: 'application/vnd.github.raw+json' } },
    fetcher
  );
  if (!packageResponse.ok) throw githubError('target package lookup', packageResponse.status);

  const packageBody = (await packageResponse.json()) as unknown;
  const packageRecord = isRecord(packageBody) ? packageBody : {};
  const version = normalizeReleaseVersion(stringValue(packageRecord.version) ?? '');
  if (packageRecord.name !== 'linketry' || !version) {
    throw new OnlineUpgradeError('GitHub returned invalid Linketry package metadata.', 502);
  }
  return { commit, version };
}

export async function readOnlineUpgradeRun(
  env: Env,
  runId: number,
  fetcher: Fetcher = globalThis.fetch
): Promise<OnlineUpgradeRun> {
  if (!Number.isSafeInteger(runId) || runId <= 0) {
    throw new OnlineUpgradeError('Invalid workflow run ID.', 400);
  }

  const config = resolveConfig(env);
  const response = await githubFetch(
    `${GITHUB_API_URL}/repos/${config.repository}/actions/runs/${runId}`,
    config.token,
    {},
    fetcher
  );
  if (!response.ok) throw githubError('status check', response.status);

  const body = (await response.json()) as unknown;
  const record = isRecord(body) ? body : {};
  const responseRunId = positiveInteger(record.id);
  const status = stringValue(record.status);
  if (responseRunId !== runId || !status) {
    throw new OnlineUpgradeError('GitHub returned an invalid workflow status.', 502);
  }

  return {
    runId,
    runUrl: safeRunUrl(record.html_url, config, runId),
    status,
    conclusion: stringValue(record.conclusion),
    headSha: stringValue(record.head_sha),
  };
}

function resolveConfig(env: Env): UpgradeConfig {
  const capability = getOnlineUpgradeCapability(env);
  if (!capability.enabled || !capability.repositoryUrl || !capability.workflowUrl) {
    const message =
      capability.reason === 'invalid_configuration'
        ? 'Online upgrade configuration is invalid.'
        : 'Online upgrade is not configured.';
    throw new OnlineUpgradeError(message, 503);
  }

  return {
    repository: env.LINKETRY_UPDATE_REPOSITORY!.trim(),
    branch: capability.branch!,
    token: env.LINKETRY_GITHUB_UPDATE_TOKEN!.trim(),
    repositoryUrl: capability.repositoryUrl,
    workflowUrl: capability.workflowUrl,
  };
}

function normalizeReleaseVersion(value: string): string | null {
  const match = value.trim().match(VERSION_PATTERN);
  if (!match) return null;
  const prerelease = match[4] ? `-${match[4]}` : '';
  return `${match[1]}.${match[2]}.${match[3]}${prerelease}`;
}

async function githubFetch(
  url: string,
  token: string,
  init: RequestInit,
  fetcher: Fetcher
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetcher(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Linketry-Online-Upgrade',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        ...init.headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'GitHub request timed out.'
        : 'GitHub request failed.';
    throw new OnlineUpgradeError(message, 502);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function workflowApiUrl(config: UpgradeConfig): string {
  return `${GITHUB_API_URL}/repos/${config.repository}/actions/workflows/${DEPLOY_WORKFLOW}`;
}

function githubError(operation: string, status: number): OnlineUpgradeError {
  const publicStatus = status === 401 || status === 403 || status === 404 ? status : 502;
  return new OnlineUpgradeError(
    `GitHub workflow ${operation} failed with HTTP ${status}.`,
    publicStatus
  );
}

function safeRunUrl(value: unknown, config: UpgradeConfig, runId: number): string {
  const expected = `${config.repositoryUrl}/actions/runs/${runId}`;
  return value === expected ? value : expected;
}

function isRepository(value: string): boolean {
  return value.length <= 200 && REPOSITORY_PATTERN.test(value) && !value.includes('..');
}

function isBranch(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    BRANCH_PATTERN.test(value) &&
    !value.includes('..') &&
    !value.includes('//') &&
    !value.startsWith('/') &&
    !value.endsWith('/')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
