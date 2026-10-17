import assert from 'node:assert/strict';
import test from 'node:test';
import { QR_QUIET_ZONE_MODULES, qrRenderOptions } from './qrCode.ts';

test('QR codes keep the four-module quiet zone required by the spec', () => {
  assert.equal(QR_QUIET_ZONE_MODULES, 4);
  assert.equal(qrRenderOptions().margin, 4);
  assert.equal(qrRenderOptions(1024).margin, 4);
});

test('QR codes render dark modules on a light background', () => {
  const { color, width, errorCorrectionLevel } = qrRenderOptions();
  assert.equal(width, 320);
  assert.equal(errorCorrectionLevel, 'M');
  assert.equal(color.dark, '#020617');
  assert.equal(color.light, '#ffffff');
});
