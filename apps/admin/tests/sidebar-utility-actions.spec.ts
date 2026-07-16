import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { EVERETTLABS_SUPPORT_URL } from '../src/utils/externalLinks';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('Sidebar groups language, theme, and reserved support actions', async ({ page }) => {
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":true}',
      });
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
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/overview');

  const actions = page.getByRole('group', { name: messages.en.quickActions });
  await expect(actions.locator('button, a')).toHaveCount(3);

  const support = actions.getByRole('link', { name: messages.en.supportEverettlabs });
  await expect(support).toHaveAttribute('href', EVERETTLABS_SUPPORT_URL);
  await expect(support).toHaveAttribute('target', '_blank');
  await expect(support).toHaveAttribute('rel', 'noopener noreferrer');

  const lightLabel = messages.en.switchTheme.replace('{theme}', messages.en.lightTheme);
  await actions.getByRole('button', { name: lightLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_theme')))
    .toBe('light');

  const languageLabel = messages.en.switchLanguage
    .replace('{current}', 'English')
    .replace('{next}', '简体中文');
  await actions.getByRole('button', { name: languageLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry.locale')))
    .toBe('zh-CN');
  await expect(page.getByRole('group', { name: messages['zh-CN'].quickActions })).toBeVisible();
});
