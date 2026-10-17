import { corePageMessages } from './corePageMessages.ts';
import { managePageMessages } from './managePageMessages.ts';
import { operationsMessages } from './operationsMessages.ts';
import { observabilityMessages } from './observabilityMessages.ts';
import { settingsPageMessages } from './settingsPageMessages.ts';
import { bulkUtmMessages } from './bulkUtmMessages.ts';
import { updateMessages } from './updateMessages.ts';
import { linkViewMessages } from './linkViewMessages.ts';
import { demoAccessLayoutMessages } from './demoAccessLayoutMessages.ts';
import { setupStatusMessages } from './setupStatusMessages.ts';
import { analyticsVisualMessages } from './analyticsVisualMessages.ts';
import { analyticsComparisonMessages } from './analyticsComparisonMessages.ts';

export const englishMessages = {
  ...corePageMessages,
  ...managePageMessages,
  ...operationsMessages,
  ...observabilityMessages,
  ...analyticsVisualMessages,
  ...analyticsComparisonMessages,
  ...settingsPageMessages,
  ...bulkUtmMessages,
  ...updateMessages,
  ...linkViewMessages,
  ...demoAccessLayoutMessages,
  ...setupStatusMessages,
  language: 'Language',
  english: 'English',
  chinese: '简体中文',
  overview: 'Overview',
  setup: 'Setup',
  links: 'Links',
  linksList: 'All Links',
  createLink: 'Create Link',
  bulkCreate: 'Bulk Create',
  analytics: 'Analytics',
  domains: 'Domains',
  redirectRules: 'Redirect Rules',
  groups: 'Groups',
  healthChecks: 'Health Checks',
  tags: 'Tags',
  importExport: 'Import / Export',
  backups: 'Backups',
  apiTokens: 'API Tokens',
  auditLogs: 'Audit Logs',
  settings: 'Settings',
  navDaily: 'Daily Management',
  navLinks: 'Manage',
  navInsightsAutomation: 'Insights & Automation',
  navTraffic: 'Traffic',
  navOperations: 'Operations',
  navOps: 'Ops',
  navSystem: 'System',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  interfaceMode: 'Interface mode',
  simple: 'Simple',
  basic: 'Basic',
  advanced: 'Advanced',
  logout: 'Logout',
  demoReadOnlyLabel: 'Read-only Demo',
  demoReadOnlyTitle: 'Public Linketry Demo · Read only',
  demoReadOnlyDescription:
    'All displayed data is synthetic. Creating, editing, deleting, importing, and configuration changes are disabled.',
  adminSubtitle: 'Enter your admin token to continue',
  adminToken: 'Admin Token',
  enterToken: 'Enter your admin token',
  showAdminToken: 'Show admin token',
  hideAdminToken: 'Hide admin token',
  apiOrigin: 'API Origin',
  defaultSameOrigin: 'Default: same origin',
  defaultValue: 'Default: {value}',
  signIn: 'Sign In',
  selfHosted: 'Self-hosted link management, analytics and monitoring',
  invalidOrigin: 'Invalid API origin. Use a full URL like https://go.example.com.',
  unreachableApi:
    'Cannot reach the API origin. Check the URL, deployment status, and CORS settings.',
  invalidToken: 'Invalid token. Please check your LINKETRY_ADMIN_TOKEN.',
  adminTokenHint:
    'LINKETRY_ADMIN_TOKEN is set before deployment as a Wrangler or GitHub Actions secret.',
  adminTokenHelp: 'Where do I find my admin token?',
  deploymentAccessTitle: 'Your deployment access details',
  deploymentAccessDescription:
    'Use the automatic Pages URL for Admin and the Worker domain for API requests.',
  demoEnvironmentTitle: 'Public Demo environment',
  demoEnvironmentDescription:
    'This screen mirrors the production Admin while using isolated Demo infrastructure.',
  demoEnvironmentSynthetic: 'Only synthetic records are displayed.',
  demoEnvironmentReadOnly: 'All data-changing actions are blocked.',
  demoEnvironmentIsolated: 'Cloudflare resources are separate from production.',
  adminUrlLabel: 'Admin dashboard',
  workerApiUrlLabel: 'Worker API',
  tokenHowToTitle: 'How to get LINKETRY_ADMIN_TOKEN',
  tokenExistingHint:
    'Create a long random token before the first deploy and save it in a password manager. Quick Deploy asks for it in Cloudflare’s form; the reviewed GitHub workflow requires `gh secret set LINKETRY_ADMIN_TOKEN`.',
  tokenGeneratedHint:
    'The GitHub Actions “Prepare Worker secrets” step copies that repository secret into the Worker. It never prints the value, because public Actions logs are not a safe place for credentials.',
  tokenSaveHint:
    'Later deployments preserve the existing Worker token. Set a new LINKETRY_ADMIN_TOKEN repository secret only to replace a lost or rotated token, then rerun deployment once.',
  openTokenGuide: 'Open the first-login guide',
  configureInstance: 'Configure your Linketry instance',
  general: 'General',
  siteName: 'Site Name',
  siteNameHint: 'Displayed in the admin panel title',
  defaultDomain: 'Default Domain',
  defaultDomainHint: 'Used to construct short_url. Leave blank to use request hostname.',
  redirectType: 'Default Redirect Type',
  temporary: 'Temporary',
  permanent: 'Permanent',
  retentionDays: 'Analytics Retention Days',
  retentionHint: '0 keeps analytics indefinitely.',
  backupRetentionDays: 'Backup Retention Days',
  backupRetentionHint:
    'R2 backups and their records are removed after this many days. Default: 30.',
  enableHealthMonitoring: 'Enable scheduled target health monitoring',
  healthMonitoringLimit: 'Links Checked Per Run',
  healthMonitoringHint:
    'Checks the original destination/Aff URL for 1-50 active links on the hourly health Cron. Failures and recoveries can trigger notification channels and signed webhooks.',
  healthFailureThreshold: 'Consecutive Failures',
  healthFailureThresholdHint: 'Alert after 1-10 consecutive failed checks. Default: 2.',
  healthSuppressionMinutes: 'Repeat Suppression (minutes)',
  healthSuppressionHint:
    'Wait 0-10080 minutes before repeating an active failure alert. Default: 1440.',
  scheduledTargetMonitoring: 'Scheduled Target Monitoring',
  manageNotificationChannels: 'Manage Notification Channels',
  saveMonitoringSettings: 'Save Monitoring Settings',
  monitoringSettingsSaved: 'Monitoring settings saved',
  publicPageTemplates: 'Public Status Page Messages',
  publicPageTemplatesHint:
    'Optional plain text. Leave blank for localized defaults. Use {{slug}} and, on warning pages, {{url}}.',
  notFoundPageMessage: '404 message',
  disabledPageMessage: 'Disabled link message',
  expiredPageMessage: 'Expired link message',
  warningPageMessage: 'Safety warning message',
  publicStatsShare: 'Public Statistics Share',
  publicStatsPrivacyHint:
    'Disabled by default. Shares aggregate clicks only; visitor records and destinations stay private.',
  shareCountries: 'Include countries',
  shareReferrers: 'Include referrers',
  createShareLink: 'Create Share Link',
  rotateShareLink: 'Rotate Share Link',
  disableShare: 'Disable Sharing',
  shareTokenHidden: 'The token is stored only as a hash. Rotate it to receive a new share URL.',
  publicStatsCreated: 'Share link created and copied',
  publicStatsDisabled: 'Public statistics disabled',
  publicStatsLoadFailed: 'Failed to load public statistics settings',
  publicStatsCreateFailed: 'Failed to create share link',
  publicStatsDisableFailed: 'Failed to disable sharing',
  saveSettings: 'Save Settings',
  settingsSaved: 'Settings saved',
  loadSettingsFailed: 'Failed to load settings',
  about: 'About',
  version: 'Version',
  platform: 'Platform',
  documentation: 'Documentation',
} as const;

export type Locale = 'en' | 'zh-CN';
export type MessageKey = keyof typeof englishMessages;
export type MessageCatalog = Record<MessageKey, string>;

const catalogLoaders: Record<Exclude<Locale, 'en'>, () => Promise<MessageCatalog>> = {
  'zh-CN': () => import('./zh-CN/index.ts').then((module) => module.zhCNMessages),
};

const loadedCatalogs: Partial<Record<Locale, MessageCatalog>> = { en: englishMessages };
const pendingCatalogs: Partial<Record<Locale, Promise<MessageCatalog>>> = {};

export function getLoadedCatalog(locale: Locale): MessageCatalog | undefined {
  return loadedCatalogs[locale];
}

export function loadCatalog(locale: Locale): Promise<MessageCatalog> {
  const loaded = loadedCatalogs[locale];
  if (loaded) return Promise.resolve(loaded);
  let pending = pendingCatalogs[locale];
  if (!pending) {
    pending = catalogLoaders[locale as Exclude<Locale, 'en'>]()
      .then((catalog) => {
        loadedCatalogs[locale] = catalog;
        return catalog;
      })
      .finally(() => {
        delete pendingCatalogs[locale];
      });
    pendingCatalogs[locale] = pending;
  }
  return pending;
}
