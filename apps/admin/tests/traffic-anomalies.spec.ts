import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('traffic anomaly settings save and a manual check shows aggregate evidence', async ({
  page,
}) => {
  let savedConfig: Record<string, unknown> | null = null;
  await page.addInitScript((version) => {
    window.localStorage.setItem('linketry_token', 'traffic-test-token');
    window.localStorage.setItem('linketry.locale', 'en');
    window.localStorage.setItem('linketry_admin_mode', 'advanced');
    window.localStorage.setItem('linketry_theme', 'dark');
    window.localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill(apiResponse({ authenticated: true }));
      return;
    }
    if (path === '/api/v1/analytics') {
      await route.fulfill(
        apiResponse({
          days: 30,
          totalClicks: 0,
          botClicks: 0,
          uniqueVisitors: 0,
          uniqueLinks: 0,
          conversionsTotal: 0,
          conversionRate: 0,
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
          topTargets: [],
          topConversionEvents: [],
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
          r2Configured: true,
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-alerts' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          config: {
            enabled: false,
            minimumVisits: 50,
            volumeMultiplier: 2,
            botRateDeltaPercentagePoints: 25,
            suppressionMinutes: 1440,
          },
          state: { active: [] },
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-alerts/config' && request.method() === 'PUT') {
      savedConfig = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill(apiResponse(savedConfig));
      return;
    }
    if (path === '/api/v1/analytics-alerts/run' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          nextState: {
            active: ['volume_spike'],
            lastEvaluatedAt: '2026-07-16T00:00:00.000Z',
            snapshot: {
              evaluatedAt: '2026-07-16T00:00:00.000Z',
              currentStart: '2026-07-15T00:00:00.000Z',
              baselineStart: '2026-07-08T00:00:00.000Z',
              currentVisits: 180,
              currentBotVisits: 18,
              baselineVisits: 420,
              baselineBotVisits: 42,
              baselineDays: 7,
              baselineAverageVisits: 60,
              currentBotRate: 10,
              baselineBotRate: 10,
              volumeRatio: 3,
              eligible: true,
              outcome: 'anomaly',
            },
          },
        })
      );
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: messages.en.trafficAnomalyAlerts })).toBeVisible();

  await page.getByLabel(messages.en.enableTrafficAnomalyAlerts).check();
  await page.getByLabel(messages.en.trafficMinimumVisits).fill('100');
  await page.getByRole('button', { name: messages.en.saveTrafficAnomalySettings }).click();
  await expect.poll(() => savedConfig?.minimumVisits).toBe(100);
  await expect.poll(() => savedConfig?.enabled).toBe(true);

  await page.getByRole('button', { name: messages.en.runTrafficAnomalyCheck }).click();
  await expect(page.getByText(messages.en.trafficVolumeSpike, { exact: true })).toBeVisible();
  await expect(page.getByText('180 vs 60 (3x)')).toBeVisible();
  await expect(page.getByText(messages.en.trafficPrivacyNote)).toBeVisible();
});
