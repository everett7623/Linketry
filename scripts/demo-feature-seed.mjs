import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function sqlValue(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function isoHoursAgo(now, hours) {
  return new Date(now.getTime() - hours * 60 * 60 * 1_000).toISOString();
}

export function buildDemoFeatureSettings(nowValue = new Date()) {
  const now = new Date(nowValue);
  if (Number.isNaN(now.getTime())) throw new Error('Demo feature seed timestamp is invalid.');

  const utmTemplates = [
    {
      id: 'linketry-demo-utm-newsletter',
      name: 'Newsletter launch',
      values: { source: 'newsletter', medium: 'email', campaign: 'launch', term: '', content: '' },
      created_at: isoHoursAgo(now, 24 * 14),
    },
    {
      id: 'linketry-demo-utm-community',
      name: 'Community sharing',
      values: {
        source: 'community',
        medium: 'social',
        campaign: 'opensource',
        term: '',
        content: '',
      },
      created_at: isoHoursAgo(now, 24 * 9),
    },
  ];
  const notificationChannels = {
    telegram: {
      enabled: false,
      credential: '000000000:synthetic-demo-token',
      target: '-1000000000000',
    },
    discord: {
      enabled: false,
      credential: 'https://discord.com/api/webhooks/000000000/synthetic-demo-token',
      target: '',
    },
  };
  const trafficState = {
    active: ['volume_spike'],
    lastAlertAt: isoHoursAgo(now, 6),
    lastEvaluatedAt: isoHoursAgo(now, 1),
    snapshot: {
      evaluatedAt: isoHoursAgo(now, 1),
      currentStart: isoHoursAgo(now, 25),
      baselineStart: isoHoursAgo(now, 24 * 8),
      currentVisits: 84,
      currentBotVisits: 5,
      baselineVisits: 196,
      baselineBotVisits: 9,
      baselineDays: 7,
      baselineAverageVisits: 28,
      currentBotRate: 0.0595238095,
      baselineBotRate: 0.0459183673,
      volumeRatio: 3,
      eligible: true,
      outcome: 'anomaly',
    },
  };

  return {
    admin_hidden_modules: '[]',
    utm_templates: JSON.stringify(utmTemplates),
    link_notes: JSON.stringify({
      'linketry-demo-link-product': 'Synthetic campaign owner: Product. Review after launch.',
      'linketry-demo-link-deploy':
        'Synthetic operations note: verify the self-hosting guide monthly.',
    }),
    notification_channels: JSON.stringify(notificationChannels),
    webhook_enabled: 'false',
    webhook_url: 'https://example.com/linketry-demo-webhook',
    webhook_events: JSON.stringify(['link.created', 'import.completed', 'health_check.failed']),
    webhook_secret: 'synthetic-demo-webhook-secret',
    traffic_anomaly_config: JSON.stringify({
      enabled: true,
      minimumVisits: 50,
      volumeMultiplier: 2,
      botRateDeltaPercentagePoints: 25,
      suppressionMinutes: 1440,
    }),
    traffic_anomaly_state: JSON.stringify(trafficState),
  };
}

export function buildDemoFeatureSeedSql({ now = new Date() } = {}) {
  const updatedAt = new Date(now);
  if (Number.isNaN(updatedAt.getTime())) throw new Error('Demo feature seed timestamp is invalid.');
  const rows = Object.entries(buildDemoFeatureSettings(updatedAt))
    .map(
      ([key, value]) =>
        `  (${sqlValue(key)}, ${sqlValue(value)}, ${sqlValue(updatedAt.toISOString())})`
    )
    .join(',\n');
  return `-- Linketry public Demo advanced feature settings. Synthetic and delivery-disabled.\nINSERT INTO settings (key, value, updated_at) VALUES\n${rows}\nON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;\n`;
}

function parseArgs(argv) {
  const outputIndex = argv.indexOf('--output');
  const output = outputIndex >= 0 ? argv[outputIndex + 1] : '';
  if (!output) throw new Error('Usage: demo-feature-seed --output <sql-file>');
  return { output };
}

async function main() {
  const { output } = parseArgs(process.argv.slice(2));
  await writeFile(output, buildDemoFeatureSeedSql(), 'utf8');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
