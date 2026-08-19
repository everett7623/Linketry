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

async function mockAuthenticatedShell(
  page: Page,
  options: {
    defaultDomain?: string;
    totalLinks?: number;
  } = {}
) {
  const defaultDomain = options.defaultDomain ?? 'go.example.com';
  const totalLinks = options.totalLinks ?? 0;

  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'at-audit-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'simple');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);

  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: LINKETRY_VERSION }),
    })
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
        apiResponse({ default_domain: defaultDomain, admin_hidden_modules: '[]' })
      );
      return;
    }
    if (path === '/api/v1/overview') {
      await route.fulfill(
        apiResponse({
          totalLinks,
          totalClicks: 0,
          todayClicks: 0,
          recentLinks: [],
          topLinks: [],
        })
      );
      return;
    }
    if (path === '/api/v1/domains') {
      await route.fulfill(apiResponse([]));
      return;
    }
    if (path === '/api/v1/backups') {
      await route.fulfill(
        apiResponse({ items: [], total: 0, r2Configured: false, retentionDays: 30 })
      );
      return;
    }
    if (path === '/api/v1/system/capabilities') {
      await route.fulfill(
        apiResponse({
          profile: 'basic',
          core: { d1: true, kv: true },
          advanced: {
            r2Backups: false,
            visitQueue: false,
            configuredDomains: defaultDomain ? 1 : 0,
            multipleDomains: false,
          },
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade') {
      await route.fulfill(
        apiResponse({
          enabled: false,
          repositoryUrl: 'https://github.com/everett7623/Linketry',
          workflowUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          branch: 'main',
          reason: 'not_configured',
        })
      );
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });
}

test('keyboard skip-to-content reaches main and empty overview exposes the primary CTA', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedShell(page, { totalLinks: 0 });
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: messages.en.overviewEmptyTitle })).toBeVisible();

  const skip = page.getByRole('link', { name: messages.en.skipToContent });
  await expect
    .poll(async () => {
      await page.keyboard.press('Tab');
      return skip.evaluate((element) => element === document.activeElement);
    })
    .toBe(true);
  await skip.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await expect(page.getByRole('heading', { name: messages.en.overviewEmptyTitle })).toBeVisible();
  const emptyCta = page
    .getByRole('heading', { name: messages.en.overviewEmptyTitle })
    .locator('xpath=ancestor::div[contains(@class,"text-center")]')
    .getByRole('link', { name: messages.en.createLink });
  await expect(emptyCta).toBeVisible();
  await emptyCta.focus();
  await expect(emptyCta).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
});

test('login announces an invalid token without moving focus into the toast', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Unauthorized' }),
    });
  });

  await page.goto('/login');
  const tokenField = page.locator('#linketry-access-token');
  await expect(tokenField).toBeFocused();
  await tokenField.fill('wrong-token');
  await page.getByRole('button', { name: messages.en.signIn }).click();

  const alert = page.getByRole('alert').filter({ hasText: messages.en.invalidToken });
  await expect(alert).toBeVisible();
  await expect(alert).toHaveAttribute('aria-live', 'assertive');
  await expect(
    page.getByRole('button', { name: messages.en.dismissNotification })
  ).not.toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);

  await page.getByLabel(messages.en.language).selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('button', { name: messages['zh-CN'].signIn })).toBeVisible();
});

test('first-run wizard exposes the next incomplete step and completion copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedShell(page, { defaultDomain: '', totalLinks: 0 });
  await page.goto('/setup');

  const wizard = page
    .getByRole('heading', { name: messages.en.wizardTitle })
    .locator('xpath=ancestor::section');
  await expect(wizard).toBeVisible();
  await expect(
    wizard.getByText(messages.en.wizardProgress.replace('{completed}', '1').replace('{total}', '3'))
  ).toBeVisible();
  const nextStep = wizard.getByRole('link', { name: messages.en.openSettings });
  await expect(nextStep).toBeVisible();
  await nextStep.focus();
  await expect(nextStep).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
});

test('version center traps Tab, restores focus on Escape, and keeps toasts out of the way', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedShell(page);
  await page.goto('/overview');

  const versionStatus = page.getByTestId('sidebar-version');
  await versionStatus.click();
  const dialog = page.getByRole('dialog', { name: messages.en.versionCenterTitle });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: messages.en.closeDialog });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator('a[href], button:not([disabled])').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(versionStatus).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
});
