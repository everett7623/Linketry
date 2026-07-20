import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deriveResourceNames, runBootstrap } from './deployment-bootstrap.mjs';
import { inspectMigrations, readMigrationSources } from './deployment-workflow-gate.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const RESOURCE_ID_PATTERN =
  /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const PREFIX_PATTERN = /^linketry-[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/i;

function readValue(value) {
  return String(value ?? '').trim();
}

function maskIdentifier(value) {
  if (!value) return 'not configured';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(12, value.length - 6))}${value.slice(-6)}`;
}

function normalizeHostname(value) {
  const candidate = readValue(value).toLowerCase();
  if (!candidate || candidate.includes('/') || candidate.includes(':')) return '';
  try {
    const parsed = new URL(`https://${candidate}`);
    return parsed.hostname === candidate ? candidate : '';
  } catch {
    return '';
  }
}

function isPlaceholderHostname(value) {
  return /[<>]/.test(value) || /(?:^|\.)example\.(?:com|net|org)$/i.test(value);
}

function normalizeOptions(options, env) {
  const prefix = readValue(options.prefix || env.LINKETRY_BOOTSTRAP_PREFIX).toLowerCase();
  const accountId = readValue(options.accountId || env.CLOUDFLARE_ACCOUNT_ID).toLowerCase();
  const domain = normalizeHostname(
    options.domain || env.LINKETRY_BOOTSTRAP_DOMAIN || env.LINKETRY_SHORT_DOMAIN
  );
  const repository = readValue(options.repository || env.LINKETRY_GITHUB_REPOSITORY);
  return {
    prefix,
    accountId,
    domain,
    repository,
    apply: Boolean(options.apply),
    confirmation: readValue(options.confirmation),
  };
}

export function expectedGitHubConfirmation({ repository, accountId, prefix }) {
  const suffix = accountId.length >= 6 ? accountId.slice(-6).toLowerCase() : 'unknown';
  return `github:${repository.toLowerCase()}:${suffix}:${prefix || 'missing-prefix'}`;
}

function validateOptions(config) {
  const errors = [];
  if (!REPOSITORY_PATTERN.test(config.repository) || config.repository.includes('..')) {
    errors.push('Use --repo with one GitHub owner/repository value.');
  }
  if (!ACCOUNT_ID_PATTERN.test(config.accountId)) {
    errors.push('CLOUDFLARE_ACCOUNT_ID or --account-id must be a 32-character account ID.');
  }
  if (!PREFIX_PATTERN.test(config.prefix) || config.prefix === 'linketry-demo') {
    errors.push(
      'Use --prefix linketry-<unique-name> with lowercase letters, numbers, and hyphens; the official Demo prefix is reserved.'
    );
  }
  if (!config.domain || isPlaceholderHostname(config.domain)) {
    errors.push(
      'Use --domain with your own hostname, without a protocol, path, or example.com placeholder.'
    );
  }
  const confirmation = expectedGitHubConfirmation(config);
  if (config.apply && config.confirmation !== confirmation) {
    errors.push(`Apply mode requires the exact confirmation phrase: ${confirmation}`);
  }
  return { errors, confirmation };
}

function runCommand(command, args, { input = '' } = {}) {
  return spawnSync(command, args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    input,
    windowsHide: true,
  });
}

function runGitHub(args, options) {
  return runCommand('gh', args, options);
}

function runGit(args) {
  return runCommand('git', args);
}

function successful(result) {
  return Boolean(result) && result.status === 0;
}

function parseJsonResult(result, description) {
  if (!successful(result)) throw new Error(`${description} failed.`);
  try {
    return JSON.parse(readValue(result.stdout));
  } catch {
    throw new Error(`${description} returned unreadable JSON.`);
  }
}

function packageVersion() {
  const value = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return readValue(value.version);
}

export function readReleaseMetadata({ gitRunner = runGit } = {}) {
  const commitResult = gitRunner(['rev-parse', 'HEAD']);
  const statusResult = gitRunner(['status', '--porcelain']);
  const commit = successful(commitResult) ? readValue(commitResult.stdout).toLowerCase() : '';
  const clean = successful(statusResult) && !readValue(statusResult.stdout);
  const migrationDigest = inspectMigrations(readMigrationSources()).digest;
  return { version: packageVersion(), commit, clean, migrationDigest };
}

export function buildGitHubVariables({ config, resources, metadata }) {
  const names = deriveResourceNames(config.prefix);
  return {
    LINKETRY_API_URL: `https://${config.domain}`,
    LINKETRY_PAGES_PROJECT: names.pages,
    LINKETRY_WORKER_NAME: names.worker,
    LINKETRY_SHORT_DOMAIN: config.domain,
    LINKETRY_D1_DATABASE_NAME: names.d1,
    LINKETRY_D1_DATABASE_ID: resources.d1.id,
    LINKETRY_KV_NAMESPACE_ID: resources.kv.id,
    LINKETRY_DEPLOYMENT_TRACK: 'fresh',
    LINKETRY_APPROVED_RELEASE: metadata.version,
    LINKETRY_APPROVED_COMMIT: metadata.commit,
    LINKETRY_APPROVED_MIGRATIONS_SHA256: metadata.migrationDigest,
    LINKETRY_FRESH_INSTALL_CONFIRMED: 'true',
    LINKETRY_VERSION: metadata.version,
  };
}

function validateReleaseMetadata(metadata) {
  const errors = [];
  if (!metadata.version) errors.push('Could not read the Linketry package version.');
  if (!SHA_PATTERN.test(metadata.commit)) errors.push('Could not read the current Git commit.');
  if (!metadata.clean) {
    errors.push(
      'The Git worktree must be clean so the approved commit contains every deployment file.'
    );
  }
  if (!DIGEST_PATTERN.test(metadata.migrationDigest)) {
    errors.push('Could not calculate the migration digest.');
  }
  return errors;
}

function resourcesFromBootstrap(report) {
  const d1 = report?.resources?.d1 ?? {};
  const kv = report?.resources?.kv ?? {};
  if (
    !report?.ok ||
    !report?.bindingOutputReady ||
    !RESOURCE_ID_PATTERN.test(readValue(d1.id)) ||
    !RESOURCE_ID_PATTERN.test(readValue(kv.id))
  ) {
    return null;
  }
  return {
    d1: { name: readValue(d1.name), id: readValue(d1.id) },
    kv: { name: readValue(kv.name), id: readValue(kv.id) },
  };
}

function baseReport(config, confirmation, errors = []) {
  return {
    ok: errors.length === 0,
    mode: config.apply ? 'apply' : 'dry-run',
    repository: config.repository || 'not configured',
    accountId: maskIdentifier(config.accountId),
    prefix: config.prefix || 'not configured',
    domain: config.domain || 'not configured',
    confirmation,
    variables: {},
    requiredSecrets: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
    mutations: [],
    mutationAttempted: false,
    mutationPerformed: false,
    errors,
  };
}

export async function runGitHubConfiguration({
  options = {},
  env = process.env,
  ghRunner = runGitHub,
  bootstrap = runBootstrap,
  metadata = null,
} = {}) {
  const config = normalizeOptions(options, env);
  const validation = validateOptions(config);
  const report = baseReport(config, validation.confirmation, [...validation.errors]);
  if (report.errors.length > 0) return report;

  const bootstrapReport = await bootstrap({
    options: {
      prefix: config.prefix,
      domain: config.domain,
      accountId: config.accountId,
    },
    env,
  });
  const resources = resourcesFromBootstrap(bootstrapReport);
  if (!resources) {
    report.errors.push(
      'Required D1/KV resources are not ready. Run deploy:bootstrap --apply, then rerun this command.'
    );
    report.ok = false;
    return report;
  }

  const release = metadata ?? readReleaseMetadata();
  report.errors.push(...validateReleaseMetadata(release));
  if (report.errors.length > 0) {
    report.ok = false;
    return report;
  }
  report.variables = buildGitHubVariables({ config, resources, metadata: release });
  if (!config.apply) return report;

  const auth = ghRunner(['auth', 'status']);
  if (!successful(auth)) report.errors.push('GitHub CLI authentication failed. Run gh auth login.');

  let repository = null;
  try {
    repository = parseJsonResult(
      ghRunner(['repo', 'view', config.repository, '--json', 'nameWithOwner']),
      'GitHub repository check'
    );
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    repository &&
    readValue(repository.nameWithOwner).toLowerCase() !== config.repository.toLowerCase()
  ) {
    report.errors.push('GitHub resolved a different repository than --repo.');
  }

  const remoteCommit = ghRunner(['api', `repos/${config.repository}/commits/main`, '--jq', '.sha']);
  if (!successful(remoteCommit)) {
    report.errors.push('Could not read the target repository main commit.');
  } else if (readValue(remoteCommit.stdout).toLowerCase() !== release.commit) {
    report.errors.push(
      'The reviewed local commit is not the target repository main commit. Push it to the fork before applying configuration.'
    );
  }

  let secretNames = [];
  try {
    const secrets = parseJsonResult(
      ghRunner(['secret', 'list', '--repo', config.repository, '--json', 'name']),
      'GitHub secret inventory'
    );
    if (!Array.isArray(secrets)) throw new Error('GitHub secret inventory was not an array.');
    secretNames = secrets.map((item) => readValue(item?.name));
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!secretNames.includes('CLOUDFLARE_API_TOKEN')) {
    report.errors.push(
      `CLOUDFLARE_API_TOKEN is missing. Run: gh secret set CLOUDFLARE_API_TOKEN --repo ${config.repository}`
    );
  }
  if (report.errors.length > 0) {
    report.ok = false;
    return report;
  }

  report.mutationAttempted = true;
  const accountSecret = ghRunner(
    ['secret', 'set', 'CLOUDFLARE_ACCOUNT_ID', '--repo', config.repository],
    { input: `${config.accountId}\n` }
  );
  if (!successful(accountSecret)) {
    report.errors.push('Could not set CLOUDFLARE_ACCOUNT_ID in GitHub Actions secrets.');
  } else {
    report.mutations.push('secret:CLOUDFLARE_ACCOUNT_ID');
  }

  for (const [name, value] of Object.entries(report.variables)) {
    if (report.errors.length > 0) break;
    const result = ghRunner([
      'variable',
      'set',
      name,
      '--body',
      value,
      '--repo',
      config.repository,
    ]);
    if (!successful(result)) {
      report.errors.push(`Could not set GitHub Actions variable ${name}.`);
      break;
    }
    report.mutations.push(`variable:${name}`);
  }

  if (report.errors.length === 0) {
    try {
      const variables = parseJsonResult(
        ghRunner(['variable', 'list', '--repo', config.repository, '--json', 'name,value']),
        'GitHub variable verification'
      );
      const values = new Map(
        Array.isArray(variables)
          ? variables.map((item) => [readValue(item?.name), readValue(item?.value)])
          : []
      );
      for (const [name, value] of Object.entries(report.variables)) {
        if (values.get(name) !== value)
          report.errors.push(`GitHub variable ${name} did not verify.`);
      }
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  report.ok = report.errors.length === 0;
  report.mutationPerformed = report.mutations.length > 0;
  return report;
}

function parseArgs(argv) {
  const options = {
    repository: '',
    prefix: '',
    domain: '',
    accountId: '',
    apply: false,
    confirmation: '',
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--repo') options.repository = argv[++index] ?? '';
    else if (argument === '--prefix') options.prefix = argv[++index] ?? '';
    else if (argument === '--domain') options.domain = argv[++index] ?? '';
    else if (argument === '--account-id') options.accountId = argv[++index] ?? '';
    else if (argument === '--apply') options.apply = true;
    else if (argument === '--confirm') options.confirmation = argv[++index] ?? '';
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Linketry beginner GitHub configuration

Usage:
  npm run deploy:configure -- --repo <owner/repository> --prefix linketry-<name> --domain <hostname> --account-id <id>
  npm run deploy:configure -- --repo <owner/repository> --prefix linketry-<name> --domain <hostname> --account-id <id> --apply --confirm <phrase>

The first command is a read-only dry-run. It reuses the exact D1/KV resources discovered
by deploy:bootstrap and prints the repository secret/variable plan. Apply requires the
printed confirmation, verifies GitHub authentication and CLOUDFLARE_API_TOKEN, then sets
the account ID plus the minimum fresh-deployment variables. It never reads or prints token values.`);
}

function printReport(report) {
  console.log(`Linketry GitHub configuration: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Repository: ${report.repository}`);
  console.log(`Cloudflare account: ${report.accountId}`);
  console.log(`Prefix: ${report.prefix}`);
  console.log(`Domain: ${report.domain}`);
  console.log('Repository variable plan:');
  for (const [name, value] of Object.entries(report.variables)) console.log(`  ${name}=${value}`);
  console.log(`Required apply confirmation: ${report.confirmation}`);
  console.log(
    report.mutations.length > 0
      ? `Applied: ${report.mutations.join(', ')}`
      : 'No GitHub repository mutations were performed.'
  );
  for (const error of report.errors) console.error(`ERROR: ${error}`);
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const report = await runGitHubConfiguration({ options });
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
