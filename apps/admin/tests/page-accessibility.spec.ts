import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/allMessages';
import { expectNoSeriousAccessibilityViolations } from './accessibility';

const link = {
  id: 'link_a11y_1',
  slug: 'docs',
  domain: 'go.example.com',
  long_url: 'https://example.com/docs',
  short_url: 'https://go.example.com/docs',
  title: 'Docs',
  description: null,
  tags: JSON.stringify(['docs']),
  redirect_type: 302,
  status: 'active',
  archived: 0,
  clicks: 40,
  expires_at: null,
  max_clicks: null,
  password_protected: false,
  warning_enabled: 0,
  source: null,
  source_id: null,
  last_clicked_at: '2026-07-21T08:00:00.000Z',
  created_at: '2026-07-10T08:00:00.000Z',
  updated_at: '2026-07-10T08:00:00.000Z',
};

const summary = {
  days: 30,
  timezoneOffsetMinutes: 0,
  rangeStart: '2026-06-21T00:00:00.000Z',
  rangeEnd: '2026-07-21T00:00:00.000Z',
  totalClicks: 50,
  botClicks: 0,
  uniqueVisitors: 12,
  uniqueLinks: 1,
  eligibleClicks: 50,
  conversionsTotal: 0,
  conversionRate: 0,
  conversionAttributionAvailable: true,
  daily: [
    { date: '2026-07-19', clicks: 0, humanClicks: 0, botClicks: 0, uniqueVisitors: 0 },
    { date: '2026-07-20', clicks: 10, humanClicks: 10, botClicks: 0, uniqueVisitors: 4 },
    { date: '2026-07-21', clicks: 40, humanClicks: 40, botClicks: 0, uniqueVisitors: 8 },
  ],
  hourlyHeatmap: [],
  topLinks: [],
  topCountries: [{ country: 'US', clicks: 50 }],
  geography: { countries: [{ country: 'US', clicks: 50 }], mappedClicks: 50, unknownClicks: 0 },
  topReferrers: [{ referer: 'https://www.google.com/', clicks: 20 }],
  topBrowsers: [{ browser: 'Chrome', clicks: 50 }],
  topDevices: [{ device_type: 'desktop', clicks: 50 }],
  topOperatingSystems: [],
  topUtmSources: [],
  topUtmMediums: [],
  topUtmCampaigns: [],
  topUtmTerms: [],
  topUtmContents: [],
  topTargets: [{ target_url: link.long_url, clicks: 50 }],
  topConversionEvents: [],
  recentVisits: [],
};

const auditItems = Array.from({ length: 3 }, (_, index) => ({
  id: `audit_${index}`,
  action: 'link.update',
  target_type: 'link',
  target_id: `link_with_a_long_identifier_${index}`,
  detail: JSON.stringify({ slug: 'docs', changed: ['long_url', 'title', 'tags'] }),
  ip_hash: null,
  user_agent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  created_at: '2026-07-21T08:00:00.000Z',
}));

function apiResponse(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) };
}

async function prepare(page: Page, theme: 'dark' | 'light') {
  await page.addInitScript(
    ({ version, theme }) => {
      localStorage.setItem('linketry_token', 'test-token');
      localStorage.setItem('linketry.locale', 'en');
      localStorage.setItem('linketry_admin_mode', 'advanced');
      localStorage.setItem('linketry_theme', theme);
      localStorage.setItem('linketry_analytics_auto_refresh', 'false');
      localStorage.setItem(
        'linketry_update_check',
        JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
      );
    },
    { version: LINKETRY_VERSION, theme }
  );
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') return route.fulfill(apiResponse({ authenticated: true }));
    if (path === '/api/v1/settings')
      return route.fulfill(apiResponse({ default_domain: 'go.example.com', admin_hidden_modules: '[]' }));
    if (path === `/api/v1/analytics/links/${link.id}`) return route.fulfill(apiResponse({ link, summary }));
    if (path === `/api/v1/public-stats/links/${link.id}`) return route.fulfill(apiResponse({ enabled: false }));
    if (path === '/api/v1/audit')
      return route.fulfill(
        apiResponse({ items: auditItems, total: auditItems.length, page: 1, pageSize: 50, totalPages: 1 })
      );
    if (path === '/api/v1/overview')
      return route.fulfill(
        apiResponse({ totalLinks: 1, totalClicks: 40, todayClicks: 3, recentLinks: [link], topLinks: [link] })
      );
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });
}

test('link analytics draws daily bars in proportion to clicks and passes axe in light theme', async ({
  page,
}) => {
  await prepare(page, 'light');
  await page.goto(`/analytics/links/${link.id}`);
  const chart = page.locator('div', {
    has: page.getByRole('heading', { name: messages.en.dailyClicks, exact: true }),
  }).last();
  await expect(chart).toBeVisible({ timeout: 15_000 });

  const heights = await chart
    .locator('[title]')
    .evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().height));
  expect(heights).toHaveLength(3);
  const [empty, ten, forty] = heights;
  expect(empty).toBeGreaterThan(0);
  expect(ten).toBeGreaterThan(empty);
  expect(forty).toBeGreaterThan(ten * 3);

  await expectNoSeriousAccessibilityViolations(page);
});

test('audit logs keep filters labelled and the table scrollable by keyboard on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, 'dark');
  await page.goto('/audit-logs');
  await expect(page.getByRole('combobox', { name: messages.en.action })).toBeVisible({
    timeout: 15_000,
  });
  const region = page.getByRole('region', { name: messages.en.auditLogs });
  await expect(region).toBeVisible();
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await region.focus();
  await expect(region).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
});

test('light theme overview status badges meet contrast requirements', async ({ page }) => {
  await prepare(page, 'light');
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: messages.en.overview })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(messages.en.activeStatus).first()).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});
