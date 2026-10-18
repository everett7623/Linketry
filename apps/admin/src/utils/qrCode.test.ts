import assert from 'node:assert/strict';
import test from 'node:test';
import {
  QR_QUIET_ZONE_MODULES,
  buildQrSvg,
  qrErrorCorrection,
  qrFileName,
  qrLayout,
  qrLogoCoverage,
} from './qrCode.ts';

function checkerboard(size: number) {
  return { size, get: (row: number, col: number) => (row + col) % 2 === 0 };
}

const solid = (size: number) => ({ size, get: () => true });

test('QR codes keep the four-module quiet zone required by the spec', () => {
  assert.equal(QR_QUIET_ZONE_MODULES, 4);
  assert.equal(qrLayout(21, false, false).side, 29);
  const svg = buildQrSvg(solid(21), { foreground: '#000000', background: '#ffffff', logo: null, caption: null, width: 290 });
  assert.match(svg, /viewBox="0 0 29 29"/);
  assert.match(svg, /d="M4 4h21v1h-21z/);
  assert.doesNotMatch(svg, /M[0-3] /);
});

test('a logo forces error correction H and covers well under 20 % of the symbol', () => {
  assert.equal(qrErrorCorrection(true), 'H');
  assert.equal(qrErrorCorrection(false), 'M');
  for (const n of [21, 25, 33, 57, 101, 177]) {
    const coverage = qrLogoCoverage(n);
    assert.ok(coverage > 0 && coverage < 0.12, `coverage ${coverage} for ${n} modules`);
    const { logo } = qrLayout(n, true, false);
    assert.ok(logo);
    assert.equal(logo.start * 2 + logo.size, n, 'logo box is centred on whole modules');
  }
});

test('modules under the logo box are left out and the logo is drawn on the background', () => {
  const logo = 'data:image/png;base64,AAAA';
  const withLogo = buildQrSvg(solid(25), { foreground: '#000000', background: '#ffffff', logo, caption: null, width: 330 });
  const plain = buildQrSvg(solid(25), { foreground: '#000000', background: '#ffffff', logo: null, caption: null, width: 330 });
  assert.match(withLogo, /<image [^>]*href="data:image\/png;base64,AAAA"/);
  assert.ok(withLogo.length !== plain.length);
  const { logo: box } = qrLayout(25, true, false);
  assert.ok(box);
  const row = box.start + QR_QUIET_ZONE_MODULES;
  assert.match(withLogo, new RegExp(`M4 ${row}h${box.start}v1h-${box.start}z`));
});

test('captions extend the canvas below the quiet zone and are escaped', () => {
  const layout = qrLayout(25, false, true);
  assert.ok(layout.captionHeight > 0);
  assert.equal(layout.height, layout.side + layout.captionHeight);
  const svg = buildQrSvg(checkerboard(25), {
    foreground: '#111111',
    background: '#ffffff',
    logo: null,
    caption: 'go.example.com/a?b=1&c=<2>',
    width: 330,
  });
  assert.match(svg, /go\.example\.com\/a\?b=1&#38;c=&#60;2&#62;<\/text>/);
  const y = Number(/<text [^>]*y="([0-9.]+)"/.exec(svg)?.[1]);
  assert.ok(y > layout.side, 'caption sits below the quiet zone');
  assert.match(svg, new RegExp(`height="${Math.round((330 * layout.height) / layout.side)}"`));
});

test('colours are applied and file names keep the slug convention', () => {
  const svg = buildQrSvg(checkerboard(21), { foreground: '#1e3a8a', background: '#fefce8', logo: null, caption: null, width: 512 });
  assert.match(svg, /<rect [^>]*fill="#fefce8"/);
  assert.match(svg, /<path fill="#1e3a8a"/);
  assert.equal(qrFileName('launch', 'svg'), 'linketry-qr-launch.svg');
  assert.equal(qrFileName('launch', 'png'), 'linketry-qr-launch.png');
});
