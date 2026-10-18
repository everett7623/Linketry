import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/allMessages';

const longUrl =
  'https://www.example.com/campaigns/2026/autumn/landing-page-with-a-very-long-path/and-more-segments?utm_source=newsletter&utm_medium=email&utm_campaign=autumn_launch_2026';

// Mirrors the visual-audit seed: long slugs and URLs, CJK titles, tag sets, source badges,
// password/warning markers and limits, so the widest realistic rows are on the first page.
const links = Array.from({ length: 12 }, (_, index) => ({
  id: `link_layout_${index}`,
  slug: index % 4 === 0 ? `campaign-autumn-2026-${index}` : `s${index}`,
  domain: 'go.example.com',
  long_url: index % 2 ? longUrl : `https://example.com/p/${index}`,
  short_url: `https://go.example.com/s${index}`,
  title:
    index % 3 === 0
      ? '秋季发布会落地页 — 2026 年度活动详情'
      : index % 3 === 1
        ? 'Autumn launch landing page for the 2026 campaign'
        : null,
  description: null,
  tags: JSON.stringify(index % 2 ? ['campaign-autumn', 'newsletter', 'email-blast'] : ['docs']),
  redirect_type: 302,
  status: index % 4 === 1 ? 'disabled' : 'active',
  archived: index === 5 ? 1 : 0,
  clicks: 1234 * index,
  expires_at: index % 5 === 0 ? '2026-12-31T23:59:00.000Z' : null,
  max_clicks: index % 6 === 0 ? 50000 : null,
  password_protected: index % 7 === 0,
  warning_enabled: index % 8 === 0 ? 1 : 0,
  source: index % 3 === 0 ? 'shlink' : null,
  source_id: null,
  last_clicked_at: null,
  created_at: '2026-10-17T08:00:00.000Z',
  updated_at: '2026-10-17T08:00:00.000Z',
}));

function apiResponse(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) };
}

async function prepare(page: Page, view?: 'table' | 'cards') {
  await page.addInitScript(
    ({ version, view }) => {
      localStorage.setItem('linketry_token', 'test-token');
      localStorage.setItem('linketry.locale', 'en');
      localStorage.setItem('linketry_admin_mode', 'advanced');
      localStorage.setItem('linketry_theme', 'dark');
      localStorage.setItem(
        'linketry_update_check',
        JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
      );
      if (view) localStorage.setItem('linketry_link_view', view);
    },
    { version: LINKETRY_VERSION, view }
  );
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') return route.fulfill(apiResponse({ authenticated: true }));
    if (path === '/api/v1/settings')
      return route.fulfill(apiResponse({ default_domain: 'go.example.com', admin_hidden_modules: '[]' }));
    if (path === '/api/v1/links')
      return route.fulfill(
        apiResponse({ items: links, total: links.length, page: 1, pageSize: 20, totalPages: 1 })
      );
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });
}

test('desktop Links table keeps row actions and created dates readable at 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, 'table');
  await page.goto('/links');

  const table = page.locator('main table');
  await expect(table.locator('tbody tr')).toHaveCount(links.length);
  await expect(table.getByRole('columnheader', { name: messages.en.actions })).toBeInViewport({ ratio: 1 });
  await expect(table.getByRole('button', { name: messages.en.delete }).first()).toBeInViewport({ ratio: 1 });

  const layout = await table.evaluate((element) => {
    const container = element.parentElement!.getBoundingClientRect();
    const rows = [...element.querySelectorAll('tbody tr')];
    return {
      containerRight: container.right,
      // The delete button is the last control in every row's action cluster.
      actionRights: rows.map((row) => {
        const buttons = row.querySelectorAll('td:last-child button');
        return buttons[buttons.length - 1].getBoundingClientRect().right;
      }),
      createdLineCounts: rows.map((row) => {
        const cell = row.children[row.children.length - 2];
        const range = document.createRange();
        range.selectNodeContents(cell);
        return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
      }),
    };
  });

  for (const right of layout.actionRights) {
    expect(right).toBeLessThanOrEqual(layout.containerRight + 1);
  }
  expect(new Set(layout.createdLineCounts)).toEqual(new Set([1]));
});

test('desktop keeps advanced filters open without a disclosure toggle', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, 'table');
  await page.goto('/links');

  await expect(page.getByRole('textbox', { name: messages.en.tag })).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.advancedFilters })).toBeHidden();
});

test.describe('narrow screens', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('Links defaults to cards with advanced filters collapsed above the fold', async ({ page }) => {
    await prepare(page);
    await page.goto('/links');

    const cards = page.locator('[data-link-view="cards"]');
    await expect(cards).toBeVisible();
    await expect(page.locator('main table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: messages.en.linkCardView })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    const toggle = page.getByRole('button', { name: messages.en.advancedFilters });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('textbox', { name: messages.en.tag })).toBeHidden();

    const firstCardTop = await cards
      .locator(':scope > *')
      .first()
      .evaluate((card) => card.getBoundingClientRect().top);
    expect(firstCardTop).toBeLessThan(844);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('textbox', { name: messages.en.tag })).toBeVisible();
  });

  test('collapsed filters report active filters and a stored table preference still wins', async ({ page }) => {
    await prepare(page, 'table');
    await page.goto('/links?tag=docs&hasPassword=yes');

    await expect(page.locator('main table')).toBeVisible();
    const toggle = page.getByRole('button', { name: messages.en.advancedFilters });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toContainText('2');
  });
});
