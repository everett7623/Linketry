import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const CORE_READ_PATHS = [
  '/api/v1/overview',
  '/api/v1/links?pageSize=5',
  '/api/v1/analytics?days=30',
  '/api/v1/domains',
  '/api/v1/groups',
  '/api/v1/tags',
  '/api/v1/redirect-rules',
  '/api/v1/health-checks/history',
  '/api/v1/import/jobs',
  '/api/v1/backups',
  '/api/v1/tokens',
  '/api/v1/audit?pageSize=5',
  '/api/v1/settings',
  '/api/v1/system/capabilities',
  '/api/v1/analytics-alerts',
  '/api/v1/utm-templates',
  '/api/v1/notifications/config',
  '/api/v1/webhooks/config',
];

const BRAND_ASSETS = ['favicon.svg', 'favicon-light.svg'];

function normalizeOrigin(value, label) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`${label} must be an HTTPS origin without credentials.`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${label} must not contain a path, query, or fragment.`);
  }
  return url.origin;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchRequired(fetchImpl, url, init = {}) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    ...init,
    headers: { 'Cache-Control': 'no-cache', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response;
}

async function verifyAdmin({ adminOrigin, version, fetchImpl, readFileImpl }) {
  const suffix = `linketry-parity=${encodeURIComponent(version)}`;
  const html = await (await fetchRequired(fetchImpl, `${adminOrigin}/?${suffix}`)).text();
  const versionPattern = new RegExp(
    `<meta\\s+name=["']linketry-version["']\\s+content=["']${version.replaceAll('.', '\\.')}["']`
  );
  if (!versionPattern.test(html)) {
    throw new Error(`Demo Admin does not advertise Linketry ${version}.`);
  }

  for (const asset of BRAND_ASSETS) {
    if (!html.includes(`/${asset}`)) throw new Error(`Demo Admin HTML is missing /${asset}.`);
    const [local, remoteResponse] = await Promise.all([
      readFileImpl(new URL(`../apps/admin/public/${asset}`, import.meta.url)),
      fetchRequired(fetchImpl, `${adminOrigin}/${asset}?${suffix}`),
    ]);
    const remote = Buffer.from(await remoteResponse.arrayBuffer());
    if (sha256(local) !== sha256(remote)) {
      throw new Error(`Demo Admin ${asset} does not match the canonical repository asset.`);
    }
  }
}

async function verifyApi({ apiOrigin, version, fetchImpl }) {
  const health = await (await fetchRequired(fetchImpl, `${apiOrigin}/health`)).json();
  if (
    health?.success !== true ||
    health?.data?.status !== 'ok' ||
    health?.data?.version !== version
  ) {
    throw new Error(`Demo Worker /health does not report Linketry ${version}.`);
  }

  await Promise.all(
    CORE_READ_PATHS.map(async (path) => {
      const payload = await (await fetchRequired(fetchImpl, `${apiOrigin}${path}`)).json();
      if (payload?.success !== true || !Object.hasOwn(payload, 'data')) {
        throw new Error(`Demo read surface ${path} returned an invalid API contract.`);
      }
    })
  );

  const writeProbe = await fetchImpl(`${apiOrigin}/api/v1/__demo_write_probe__`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (writeProbe.status !== 403) {
    throw new Error(`Demo write boundary returned HTTP ${writeProbe.status}; expected 403.`);
  }
}

export async function verifyDemoLiveParity({
  adminUrl,
  apiUrl,
  version,
  fetchImpl = fetch,
  readFileImpl = readFile,
}) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Version must use semantic versioning.');
  const adminOrigin = normalizeOrigin(adminUrl, 'Admin URL');
  const apiOrigin = normalizeOrigin(apiUrl, 'API URL');
  await verifyAdmin({ adminOrigin, version, fetchImpl, readFileImpl });
  await verifyApi({ apiOrigin, version, fetchImpl });
  return { adminOrigin, apiOrigin, version, readChecks: CORE_READ_PATHS.length };
}

export async function waitForDemoLiveParity(options, attempts = 12, delayMs = 10_000) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await verifyDemoLiveParity(options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(
          `Demo parity attempt ${attempt}/${attempts} is not ready: ${error instanceof Error ? error.message : String(error)}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function parseArgs(argv) {
  const result = { adminUrl: '', apiUrl: '', version: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--admin-url') result.adminUrl = argv[++index] ?? '';
    else if (argument === '--api-url') result.apiUrl = argv[++index] ?? '';
    else if (argument === '--version') result.version = argv[++index] ?? '';
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!result.adminUrl || !result.apiUrl || !result.version) {
    throw new Error('Usage: demo-live-smoke --admin-url <url> --api-url <url> --version <semver>');
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await waitForDemoLiveParity(options);
  console.log(
    `Demo parity verified: Admin ${report.version}, canonical brand assets, ${report.readChecks} read APIs, and write rejection.`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
