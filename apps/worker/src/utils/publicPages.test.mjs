import assert from 'node:assert/strict';
import test from 'node:test';
import {
  renderDisabledPage,
  renderExpiredPage,
  renderNotFoundPage,
  renderPasswordPage,
  renderWarningPage,
  resolvePublicLocale,
} from './publicPages.ts';
import { redirectResponse } from './redirectResponse.ts';
import { jsonError, jsonOk } from './jsonResponse.ts';

test('public pages default to English and honor language quality', () => {
  assert.equal(resolvePublicLocale(), 'en');
  assert.equal(resolvePublicLocale('en-US,en;q=0.9,zh-CN;q=0.8'), 'en');
  assert.equal(resolvePublicLocale('zh-CN,zh;q=0.9,en;q=0.5'), 'zh-CN');
  assert.equal(resolvePublicLocale('fr,zh;q=0.7,en;q=0.8'), 'en');
});

test('public pages render localized copy and escape user-controlled values', () => {
  assert.match(renderNotFoundPage('en'), /Link Not Found/);
  assert.match(renderNotFoundPage('zh-CN'), /未找到短链/);
  assert.match(renderDisabledPage('zh-CN'), /短链已停用/);
  assert.match(renderExpiredPage('zh-CN'), /短链已过期/);
  assert.match(renderDisabledPage('en'), /<html lang="en">/);
  assert.match(renderExpiredPage('zh-CN'), /<html lang="zh-CN">/);
  assert.match(renderPasswordPage('zh-CN', '<script>', true), /密码不正确/);
  assert.doesNotMatch(renderPasswordPage('en', '<script>', false), /<script>/);
  assert.match(
    renderWarningPage('zh-CN', 'go', 'https://example.com/?x=<tag>', false),
    /&lt;tag&gt;/
  );
  assert.match(renderDisabledPage('en', { message: 'Contact <support>' }), /Contact &lt;support&gt;/);
  assert.doesNotMatch(renderWarningPage('en', 'go', 'https://example.com', false, { message: '<script>x</script>' }), /<script>/);
});

/** 页面"继续"链接或表单的目标地址，取属性原文（含 HTML 转义）。 */
function continueAttribute(html) {
  return html.match(/<(?:a class="button" href|form method="post" action)="([^"]*)"/)?.[1];
}

test('password and warning pages carry the visitor query into their link and forms (H5)', () => {
  const query = new URLSearchParams('utm_source=news&utm_medium=e mail');
  const carried = 'utm_source=news&amp;utm_medium=e+mail';

  assert.equal(continueAttribute(renderPasswordPage('en', 'promo', true, query)), `/promo?${carried}`);
  assert.equal(
    continueAttribute(renderWarningPage('en', 'promo', 'https://example.com', false, undefined, query)),
    `/promo?linketry_confirm=1&amp;${carried}`
  );
  const withPassword = renderWarningPage('zh-CN', 'promo', 'https://example.com', true, undefined, query);
  assert.match(withPassword, /<form method="post"/);
  assert.equal(continueAttribute(withPassword), `/promo?linketry_confirm=1&amp;${carried}`);
});

test('without a visitor query the pages keep their previous link and form targets', () => {
  for (const query of [undefined, new URLSearchParams()]) {
    assert.equal(continueAttribute(renderPasswordPage('en', 'promo', false, query)), '/promo');
    for (const requiresPassword of [false, true]) {
      const html = renderWarningPage('en', 'promo', 'https://example.com', requiresPassword, undefined, query);
      assert.equal(continueAttribute(html), '/promo?linketry_confirm=1');
    }
  }
});

test('a carried query cannot break out of the link or form attribute', () => {
  const query = new URLSearchParams([['q', `"><script>alert(1)</script>`], ['x', `a'b&c`]]);
  const encoded = 'q=%22%3E%3Cscript%3Ealert%281%29%3C%2Fscript%3E&amp;x=a%27b%26c';

  const password = renderPasswordPage('en', 'promo', false, query);
  const warning = renderWarningPage('en', 'promo', 'https://example.com', false, undefined, query);
  assert.doesNotMatch(password + warning, /<script>/);
  assert.equal(continueAttribute(password), `/promo?${encoded}`);
  assert.equal(continueAttribute(warning), `/promo?linketry_confirm=1&amp;${encoded}`);
});

test('normal redirect responses preserve status and Location without a body', async () => {
  for (const status of [301, 302]) {
    const response = redirectResponse('https://example.com/path', status);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Location'), 'https://example.com/path');
    assert.equal(await response.text(), '');
  }
});

test('API JSON responses prevent stale Admin state from being cached', () => {
  assert.equal(jsonOk({ ok: true }).headers.get('Cache-Control'), 'private, no-store');
  assert.equal(jsonError('invalid').headers.get('Cache-Control'), 'private, no-store');
});
