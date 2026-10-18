import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { expect, test, type Download, type Page } from '@playwright/test';
import { DEFAULT_QR_STYLE, type QrStyle } from '../../../packages/shared/src/qrStyle';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/allMessages';
import { expectNoSeriousAccessibilityViolations } from './accessibility';

const jsQrPath = createRequire(import.meta.url).resolve('jsqr/dist/jsQR.js');
const en = messages.en;

const link = {
  id: 'link_qr_1',
  slug: 'docs',
  domain: 'go.example.com',
  long_url: 'https://example.com/docs',
  title: 'Docs',
  description: null,
  tags: '[]',
  redirect_type: 302,
  status: 'active',
  archived: 0,
  clicks: 4,
  expires_at: null,
  max_clicks: null,
  password_protected: false,
  warning_enabled: 0,
  source: null,
  source_id: null,
  last_clicked_at: null,
  created_at: '2026-07-10T08:00:00.000Z',
  updated_at: '2026-07-10T08:00:00.000Z',
};
const shortUrl = `https://${link.domain}/${link.slug}`;

const LOGO_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" rx="120" fill="#e11d48"/><circle cx="300" cy="300" r="150" fill="#ffffff"/></svg>'
);

function apiResponse(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) };
}

async function prepare(page: Page, stored: { style: QrStyle; puts: QrStyle[] }) {
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem('linketry_update_check', JSON.stringify({ latestVersion: version, checkedAt: Date.now() }));
  }, LINKETRY_VERSION);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/auth/me') return route.fulfill(apiResponse({ authenticated: true }));
    if (path === '/api/v1/settings')
      return route.fulfill(apiResponse({ default_domain: link.domain, admin_hidden_modules: '[]' }));
    if (path === '/api/v1/links')
      return route.fulfill(apiResponse({ items: [link], total: 1, page: 1, pageSize: 20, totalPages: 1 }));
    if (path === '/api/v1/qr-style' && request.method() === 'GET') return route.fulfill(apiResponse(stored.style));
    if (path === '/api/v1/qr-style' && request.method() === 'PUT') {
      stored.style = request.postDataJSON() as QrStyle;
      stored.puts.push(stored.style);
      return route.fulfill(apiResponse(stored.style));
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });
}

async function openQrDialog(page: Page) {
  await page.goto('/links');
  await page.getByRole('table').getByRole('button', { name: en.qrCode }).click();
  const dialog = page.getByRole('dialog', { name: en.qrCodeTitle.replace('{slug}', link.slug) });
  await expect(dialog.getByAltText(en.qrCodeFor.replace('{url}', shortUrl))).toBeVisible();
  return dialog;
}

/** Decodes a downloaded PNG in the page with the real jsQR build, independent of the Admin's own check. */
async function decodePng(page: Page, download: Download) {
  const path = await download.path();
  const base64 = (await readFile(path)).toString('base64');
  await page.addScriptTag({ path: jsQrPath });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const decode = (window as unknown as { jsQR: (d: Uint8ClampedArray, w: number, h: number) => { data: string } | null }).jsQR;
    return { width: image.naturalWidth, height: image.naturalHeight, text: decode(pixels.data, pixels.width, pixels.height)?.data ?? null };
  }, base64);
}

test('a styled QR code with a logo downloads as a scannable PNG and a matching SVG', async ({ page }) => {
  const stored = { style: { ...DEFAULT_QR_STYLE }, puts: [] as QrStyle[] };
  await prepare(page, stored);
  const dialog = await openQrDialog(page);
  const status = dialog.getByRole('status');

  await dialog.getByLabel(en.qrForeground).fill('#1e3a8a');
  await dialog.getByLabel(en.qrCaption).check();
  await dialog.getByLabel(en.qrLogoUpload).setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: LOGO_SVG });
  await expect(dialog.getByAltText(en.qrLogoPreview)).toBeVisible();
  await expect(status).toHaveText(en.qrScanPassed);
  await dialog.getByLabel(en.qrSize).selectOption('512');

  const pngDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: en.downloadPng }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toBe('linketry-qr-docs.png');
  const decoded = await decodePng(page, png);
  expect(decoded.text).toBe(shortUrl);
  expect(decoded.width).toBe(512);
  expect(decoded.height).toBeGreaterThan(512);

  await dialog.getByLabel(en.qrFormat).selectOption('svg');
  const svgDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: en.downloadSvg }).click();
  const svgFile = await svgDownload;
  expect(svgFile.suggestedFilename()).toBe('linketry-qr-docs.svg');
  const svg = await readFile(await svgFile.path(), 'utf8');
  expect(svg).toMatch(/^<svg [^>]*width="512"/);
  expect(svg).toContain('fill="#1e3a8a"');
  expect(svg).toContain('href="data:image/png;base64,');
  expect(svg).toContain('>go.example.com/docs</text>');
  expect(svg).not.toContain('<script');

  await expectNoSeriousAccessibilityViolations(page);
});

test('unsafe colours block the download and explain why', async ({ page }) => {
  await prepare(page, { style: { ...DEFAULT_QR_STYLE }, puts: [] });
  const dialog = await openQrDialog(page);
  const download = dialog.getByRole('button', { name: en.downloadPng });
  const status = dialog.getByRole('status');

  await dialog.getByLabel(en.qrForeground).fill('#f8fafc');
  await dialog.getByLabel(en.qrBackground).fill('#0f172a');
  await expect(status).toHaveText(en.qrColorInverted);
  await expect(download).toBeDisabled();
  await expect(dialog.getByRole('button', { name: en.qrSaveDefault })).toBeDisabled();

  await dialog.getByLabel(en.qrForeground).fill('#9ca3af');
  await dialog.getByLabel(en.qrBackground).fill('#ffffff');
  await expect(status).toHaveText(en.qrColorLowContrast);
  await expect(download).toBeDisabled();

  await dialog.getByRole('button', { name: en.qrResetStyle }).click();
  await expect(status).toHaveText('');
  await expect(download).toBeEnabled();
});

test('the default style is saved, reused on the next open, and the decoder only loads for styled codes', async ({
  page,
}) => {
  const stored = { style: { ...DEFAULT_QR_STYLE }, puts: [] as QrStyle[] };
  await prepare(page, stored);
  const decoderRequests: string[] = [];
  page.on('request', (request) => {
    if (/jsqr/i.test(request.url())) decoderRequests.push(request.url());
  });

  let dialog = await openQrDialog(page);
  await expect(dialog.getByRole('button', { name: en.downloadPng })).toBeEnabled();
  expect(decoderRequests).toEqual([]);

  await dialog.getByLabel(en.qrForeground).fill('#14532d');
  await dialog.getByLabel(en.qrFormat).selectOption('svg');
  await expect(dialog.getByRole('status')).toHaveText(en.qrScanPassed);
  expect(decoderRequests.length).toBeGreaterThan(0);
  await dialog.getByRole('button', { name: en.qrSaveDefault }).click();
  await expect(page.getByText(en.qrStyleSaved)).toBeVisible();
  expect(stored.puts).toEqual([{ ...DEFAULT_QR_STYLE, foreground: '#14532d', format: 'svg' }]);

  await page.reload();
  dialog = await openQrDialog(page);
  await expect(dialog.getByLabel(en.qrForeground)).toHaveValue('#14532d');
  await expect(dialog.getByRole('button', { name: en.downloadSvg })).toBeEnabled();
});

test('a code that does not decode back to the short URL blocks the download', async ({ page }) => {
  await prepare(page, { style: { ...DEFAULT_QR_STYLE, foreground: '#14532d' }, puts: [] });
  await page.route(/jsqr/i, (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'export default function jsQR() { return { data: "https://go.example.com/other" }; }',
    })
  );
  const dialog = await openQrDialog(page);
  await expect(dialog.getByRole('status')).toHaveText(en.qrScanFailed);
  await expect(dialog.getByRole('button', { name: en.downloadPng })).toBeDisabled();
});

test('a missing decoder chunk warns but still allows the download', async ({ page }) => {
  await prepare(page, { style: { ...DEFAULT_QR_STYLE, foreground: '#14532d' }, puts: [] });
  await page.route(/jsqr/i, (route) => route.abort());
  const dialog = await openQrDialog(page);
  await expect(dialog.getByRole('status')).toHaveText(en.qrScanUnavailable);
  await expect(dialog.getByRole('button', { name: en.downloadPng })).toBeEnabled();
});
