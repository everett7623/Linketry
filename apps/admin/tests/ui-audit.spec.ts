import { expect, test } from '@playwright/test';
import { expectNoSeriousAccessibilityViolations } from './accessibility';

test.beforeEach(async ({ page }) => {
  await page.route('**/__ui-audit', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en" data-theme="light"><head><title>UI audit</title></head>
      <body><main id="root"></main><script type="module">
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      import '/src/index.css';
      import React from '/node_modules/.vite/deps/react.js';
      import ReactDOMClient from '/node_modules/.vite/deps/react-dom_client.js';
      const { LocaleProvider } = await import('/src/contexts/LocaleContext.tsx');
      const { ToastProvider, useToast } = await import('/src/components/ui/Toast.tsx');
      const { ConfirmDialog } = await import('/src/components/ui/Modal.tsx');
      const h = React.createElement;
      function Harness() {
        const [open, setOpen] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const toast = useToast();
        return h(React.Fragment, null,
          h('h1', null, 'UI audit'),
          h('button', { onClick: () => toast.error('https://example.com/' + 'long'.repeat(80)) }, 'Notify'),
          h('button', { onClick: () => setOpen(true) }, 'Open confirm'),
          h(ConfirmDialog, { open, loading, title: 'Delete link', message: 'Confirm deletion',
            onClose: () => setOpen(false), onConfirm: () => setLoading(true) }));
      }
      localStorage.setItem('linketry.locale', 'en');
      ReactDOMClient.createRoot(document.getElementById('root')).render(h(LocaleProvider, null, h(ToastProvider, null, h(Harness))));
      </script></body></html>`,
  }));
});

test('long notification stays inside a narrow viewport and passes light-theme contrast', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/__ui-audit');
  await page.getByRole('button', { name: 'Notify', exact: true }).click();
  const notification = page.getByRole('alert');
  await expect(notification).toBeVisible();
  const box = await notification.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expectNoSeriousAccessibilityViolations(page);
  await page.screenshot({ path: test.info().outputPath('notification-light-mobile.png') });
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(notification).toHaveCount(0);
});

test('pending confirmation blocks Escape, backdrop and close while preserving focus trap', async ({ page }) => {
  await page.goto('/__ui-audit');
  await page.getByRole('button', { name: 'Open confirm' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete link' });
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(dialog).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
});
