import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/allMessages';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function prepareAuthenticatedOverview(page: Page, locale?: string) {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.addInitScript(
    ({ version, storedLocale }) => {
      window.localStorage.setItem('linketry_token', 'production-smoke-token');
      window.localStorage.setItem('linketry_demo_access', 'granted');
      window.localStorage.setItem(
        'linketry_update_check',
        JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
      );
      if (storedLocale) window.localStorage.setItem('linketry.locale', storedLocale);
    },
    { version: LINKETRY_VERSION, storedLocale: locale }
  );
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
    await route.fulfill(apiResponse({}));
  });
  return browserErrors;
}

test('built Admin renders the authenticated overview without module identity errors', async ({
  page,
}) => {
  const browserErrors = await prepareAuthenticatedOverview(page);
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test('built Admin loads the stored Chinese catalog before the first render', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  // Production builds submit with signIn; public Demo builds submit with enterDemo.
  const englishLabels = [messages.en.signIn, messages.en.enterDemo];
  const chineseLabels = [messages['zh-CN'].signIn, messages['zh-CN'].enterDemo];
  await page.addInitScript((labels) => {
    window.localStorage.setItem('linketry.locale', 'zh-CN');
    const state = { sawEnglish: false };
    (window as unknown as { __localeFlash: typeof state }).__localeFlash = state;
    new MutationObserver(() => {
      const text = document.body?.textContent ?? '';
      if (labels.some((label) => text.includes(label))) state.sawEnglish = true;
    }).observe(document, { childList: true, subtree: true, characterData: true });
  }, englishLabels);
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: new RegExp(`^(${chineseLabels.join('|')})$`) })
  ).toBeVisible();
  const sawEnglish = await page.evaluate(
    () => (window as unknown as { __localeFlash: { sawEnglish: boolean } }).__localeFlash.sawEnglish
  );
  expect(sawEnglish).toBe(false);
  expect(browserErrors).toEqual([]);
});
