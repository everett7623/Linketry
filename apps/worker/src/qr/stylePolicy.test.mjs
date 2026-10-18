import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_QR_STYLE,
  QR_LOGO_MAX_BYTES,
  checkQrColors,
  contrastRatio,
  parseStoredQrStyle,
  readPngDataUrlSize,
  validateQrStyle,
} from '../../../../packages/shared/src/qrStyle.ts';

function pngDataUrl(width, height, padding = 0) {
  const header = Buffer.alloc(33 + padding);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return `data:image/png;base64,${header.toString('base64')}`;
}

const style = (overrides = {}) => ({ ...DEFAULT_QR_STYLE, ...overrides });

test('the default style is valid and round-trips through storage', () => {
  assert.deepEqual(validateQrStyle(DEFAULT_QR_STYLE), { valid: true, style: DEFAULT_QR_STYLE });
  assert.deepEqual(parseStoredQrStyle(JSON.stringify(DEFAULT_QR_STYLE)), DEFAULT_QR_STYLE);
});

test('colour checks reject inverted, low-contrast and malformed colours', () => {
  assert.equal(checkQrColors('#000000', '#ffffff'), null);
  assert.equal(checkQrColors('#ffffff', '#000000'), 'inverted');
  assert.equal(checkQrColors('#777777', '#999999'), 'low_contrast');
  assert.equal(checkQrColors('#fff', '#000000'), 'invalid_color');
  assert.equal(checkQrColors('red', '#ffffff'), 'invalid_color');
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 1e-9);
  assert.equal(validateQrStyle(style({ foreground: '#ffffff', background: '#020617' })).valid, false);
  assert.equal(validateQrStyle(style({ foreground: '#777777', background: '#999999' })).valid, false);
});

test('colours are normalised to lower case', () => {
  const result = validateQrStyle(style({ foreground: '#1E3A8A', background: '#FFFFFF' }));
  assert.equal(result.valid, true);
  assert.equal(result.style.foreground, '#1e3a8a');
  assert.equal(result.style.background, '#ffffff');
});

test('logos must be small PNG data URLs', () => {
  assert.deepEqual(readPngDataUrlSize(pngDataUrl(128, 64)), { width: 128, height: 64 });
  assert.equal(validateQrStyle(style({ logo: pngDataUrl(256, 256) })).valid, true);
  assert.equal(validateQrStyle(style({ logo: pngDataUrl(257, 100) })).valid, false);
  assert.equal(validateQrStyle(style({ logo: pngDataUrl(0, 10) })).valid, false);
  assert.equal(validateQrStyle(style({ logo: pngDataUrl(64, 64, QR_LOGO_MAX_BYTES) })).valid, false);
  assert.equal(validateQrStyle(style({ logo: 'data:image/svg+xml;base64,PHN2Zz4=' })).valid, false);
  assert.equal(validateQrStyle(style({ logo: 'data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' })).valid, false);
  assert.equal(validateQrStyle(style({ logo: 'https://example.com/logo.png' })).valid, false);
});

test('unknown fields, sizes, formats and non-boolean captions are rejected', () => {
  assert.equal(validateQrStyle(style({ shape: 'dots' })).valid, false);
  assert.equal(validateQrStyle(style({ size: 300 })).valid, false);
  assert.equal(validateQrStyle(style({ format: 'pdf' })).valid, false);
  assert.equal(validateQrStyle(style({ caption: 'yes' })).valid, false);
  assert.equal(validateQrStyle(null).valid, false);
  assert.equal(validateQrStyle([]).valid, false);
});

test('corrupt stored values fall back to the standard style', () => {
  assert.deepEqual(parseStoredQrStyle(null), DEFAULT_QR_STYLE);
  assert.deepEqual(parseStoredQrStyle('{not json'), DEFAULT_QR_STYLE);
  assert.deepEqual(parseStoredQrStyle(JSON.stringify(style({ foreground: '#ffffff', background: '#000000' }))), DEFAULT_QR_STYLE);
});
