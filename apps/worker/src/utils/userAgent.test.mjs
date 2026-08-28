import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectBrowserId,
  detectBrowserLabel,
  detectDevice,
  detectOS,
} from './userAgent.ts';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0';
const OPERA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1';

test('modern Opera is detected as Opera, not Chrome', () => {
  assert.equal(detectBrowserId(OPERA), 'opera');
  assert.equal(detectBrowserLabel(OPERA), 'Opera');
});

test('Edge is detected before Chrome', () => {
  assert.equal(detectBrowserId(EDGE), 'edge');
  assert.equal(detectBrowserId(CHROME), 'chrome');
  assert.equal(detectBrowserId(FIREFOX), 'firefox');
});

test('device classification prefers tablet over mobile', () => {
  assert.equal(detectDevice(IPAD), 'tablet');
  assert.equal(detectDevice(IPHONE), 'mobile');
  assert.equal(detectDevice(CHROME), 'desktop');
});

test('analytics and redirect rules agree on device for the same UA', () => {
  for (const ua of [CHROME, EDGE, OPERA, FIREFOX, IPHONE, IPAD]) {
    assert.equal(detectDevice(ua), detectDevice(ua));
  }
});

test('OS detection returns a known label', () => {
  assert.equal(detectOS(CHROME), 'Windows');
  assert.equal(detectOS(IPHONE), 'iOS');
  assert.equal(detectOS('unknown'), 'Other');
});
