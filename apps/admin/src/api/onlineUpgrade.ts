import { normalizeVersion } from '../utils/versionCheck.ts';
import { apiGet, apiPost, getApiBase } from './client.ts';

const RUNTIME_CHECK_TIMEOUT_MS = 8_000;
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

export function getOnlineUpgradeCapability(): Promise<OnlineUpgradeCapability> {
  return apiGet<OnlineUpgradeCapability>('/api/v1/system/upgrade');
}

export function startOnlineUpgrade(): Promise<OnlineUpgradeDispatch> {
  return apiPost<OnlineUpgradeDispatch>('/api/v1/system/upgrade');
}

export function getOnlineUpgradeRun(runId: number): Promise<OnlineUpgradeRun> {
  return apiGet<OnlineUpgradeRun>(`/api/v1/system/upgrade/${runId}`);
}

export async function fetchRuntimeVersion(
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs = RUNTIME_CHECK_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${getApiBase()}/health`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Runtime version check failed with HTTP ${response.status}.`);
    const body = (await response.json()) as {
      success?: unknown;
      data?: { version?: unknown };
    };
    const version =
      body.success === true && typeof body.data?.version === 'string'
        ? normalizeVersion(body.data.version)
        : null;
    if (!version) throw new Error('Runtime returned an invalid Linketry version.');
    return version;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
