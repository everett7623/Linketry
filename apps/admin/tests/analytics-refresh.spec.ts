import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { expectNoSeriousAccessibilityViolations } from './accessibility';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function prepareAnalytics(page: Page) {
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem('linketry_analytics_auto_refresh', 'true');
    localStorage.setItem('linketry_analytics_refresh_interval', '10');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
}

test('Analytics supports manual refresh and persistent near-real-time controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareAnalytics(page);
  let analyticsRequests = 0;

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill(apiResponse({ authenticated: true }));
      return;
    }
    if (path === '/api/v1/settings') {
      await route.fulfill(
        apiResponse({ default_domain: 'go.example.com', admin_hidden_modules: '[]' })
      );
      return;
    }
    if (path === '/api/v1/analytics') {
      analyticsRequests += 1;
      await route.fulfill(
        apiResponse({
          days: 30,
          totalClicks: analyticsRequests,
          botClicks: 0,
          uniqueVisitors: analyticsRequests,
          uniqueLinks: 1,
          eligibleClicks: 25,
          conversionsTotal: 4,
          conversionRate: 16,
          conversionAttributionAvailable: true,
          daily: [],
          topLinks: [],
          topCountries: [],
          topReferrers: [],
          topBrowsers: [],
          topDevices: [],
          topOperatingSystems: [],
          topUtmSources: [],
          topUtmMediums: [],
          topUtmCampaigns: [],
          topUtmTerms: [],
          topUtmContents: [],
          topTargets: [
            {
              target_url:
                'https://example.com/a/very/long/analytics/target?utm_source=linketry&utm_campaign=mobile-overflow-regression',
              clicks: 12,
            },
          ],
          topConversionEvents: [
            {
              event_name: 'signup',
              currency: 'USD',
              conversions: 4,
              value_total: 54,
            },
          ],
          recentVisits: [],
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-views') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path === '/api/v1/analytics-reports') {
      await route.fulfill(
        apiResponse({
          config: { enabled: false, days: 30, saved_view_id: null },
          records: [],
          r2Configured: false,
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-alerts') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: '{"error":"mock"}',
      });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/analytics');
  await expect(
    page.getByRole('heading', { name: messages.en.analytics, exact: true })
  ).toBeVisible();
  await expect.poll(() => analyticsRequests).toBeGreaterThan(0);
  await expect
    .poll(() => page.locator('main').evaluate((main) => main.scrollWidth === main.clientWidth))
    .toBe(true);
  await expect(page.getByLabel(messages.en.country)).toHaveCount(0);
  const advancedFilters = page.getByRole('button', {
    name: messages.en.advancedAnalyticsFilters,
  });
  await expect(advancedFilters).toHaveAttribute('aria-expanded', 'false');
  await advancedFilters.click();
  await expect(page.getByLabel(messages.en.country)).toBeVisible();
  await expect(advancedFilters).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() => page.locator('main').evaluate((main) => main.scrollWidth === main.clientWidth))
    .toBe(true);

  const conversionInsights = page.getByTestId('conversion-insights');
  await expect(
    conversionInsights.getByText(messages.en.humanClicks, { exact: true })
  ).toBeVisible();
  await expect(conversionInsights.getByText('25', { exact: true })).toBeVisible();
  await expect(
    conversionInsights.getByTestId('conversion-values').getByText('$54.00', { exact: true })
  ).toBeVisible();
  await expect(conversionInsights.getByText('signup', { exact: true })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  const requestsBeforeManualRefresh = analyticsRequests;

  await page.getByRole('button', { name: messages.en.refreshAnalyticsNow }).click();
  await expect.poll(() => analyticsRequests).toBe(requestsBeforeManualRefresh + 1);

  const autoRefresh = page.getByRole('checkbox', { name: messages.en.autoRefresh });
  await expect(autoRefresh).toBeChecked();
  await autoRefresh.uncheck();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_analytics_auto_refresh')))
    .toBe('false');

  await autoRefresh.check();
  const interval = page.getByRole('combobox', { name: messages.en.autoRefreshInterval });
  await interval.selectOption('5');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_analytics_refresh_interval')))
    .toBe('5');
});
