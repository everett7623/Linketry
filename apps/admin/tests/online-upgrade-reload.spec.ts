import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';

const targetVersion = '99.0.0';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('successful deployment reloads a stale finalizing page within a bounded delay', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
  });
  await page.route('https://api.github.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: targetVersion }),
    });
  });
  await page.route('**/health', async (route) => {
    await route.fulfill(apiResponse({ status: 'ok', name: 'Linketry', version: LINKETRY_VERSION }));
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    if (path === '/api/v1/settings') {
      await route.fulfill(
        apiResponse({ default_domain: 'go.example.com', admin_hidden_modules: '[]' })
      );
      return;
    }
    if (path === '/api/v1/overview') {
      await route.fulfill(
        apiResponse({
          totalLinks: 0,
          totalClicks: 0,
          todayClicks: 0,
          recentLinks: [],
          topLinks: [],
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          enabled: true,
          repositoryUrl: 'https://github.com/everett7623/Linketry',
          workflowUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          branch: 'main',
          reason: 'ready',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          accepted: true,
          runId: 123,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/123',
          status: 'requested',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade/123') {
      await route.fulfill(
        apiResponse({
          runId: 123,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/123',
          status: 'completed',
          conclusion: 'success',
          headSha: '1234567890abcdef',
        })
      );
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{"error":"missing mock"}',
    });
  });

  await page.goto('/overview');
  await page.getByRole('button', { name: messages.en.upgradeOnline }).click();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: messages.en.confirmUpgrade }).click();
  await expect(page.getByText(messages.en.upgradeFinalizing)).toBeVisible();
  await reloaded;

  await expect(page.getByRole('button', { name: messages.en.upgradeOnline })).toBeEnabled();
  await expect(page.getByText(messages.en.upgradeFinalizing)).toHaveCount(0);
});
