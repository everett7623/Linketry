/** QR Code Model 2 requires a light border of at least four modules on every side. */
export const QR_QUIET_ZONE_MODULES = 4;

export const DEFAULT_QR_COLORS = { dark: '#020617', light: '#ffffff' } as const;

/** Logo box side as a share of the symbol side; its area stays well under the 20 % that error correction H can absorb. */
export const QR_LOGO_SIDE_RATIO = 0.24;

const CAPTION_HEIGHT_RATIO = 0.12;
const CAPTION_FONT_RATIO = 0.05;

export type QrErrorCorrection = 'M' | 'H';

export function qrErrorCorrection(hasLogo: boolean): QrErrorCorrection {
  return hasLogo ? 'H' : 'M';
}

export interface QrMatrix {
  size: number;
  get(row: number, col: number): unknown;
}

export interface QrSvgOptions {
  foreground: string;
  background: string;
  logo: string | null;
  caption: string | null;
  /** Output width in pixels; height grows with the caption. */
  width: number;
}

export interface QrLayout {
  /** Symbol plus quiet zone, in modules. */
  side: number;
  /** Full canvas height, in modules. */
  height: number;
  logo: { start: number; size: number } | null;
  captionHeight: number;
}

export function qrLayout(moduleCount: number, hasLogo: boolean, hasCaption: boolean): QrLayout {
  const side = moduleCount + QR_QUIET_ZONE_MODULES * 2;
  let logo: QrLayout['logo'] = null;
  if (hasLogo) {
    let size = Math.ceil(moduleCount * QR_LOGO_SIDE_RATIO);
    if ((moduleCount - size) % 2 !== 0) size += 1;
    logo = { start: (moduleCount - size) / 2, size };
  }
  const captionHeight = hasCaption ? Math.round(side * CAPTION_HEIGHT_RATIO) : 0;
  return { side, height: side + captionHeight, logo, captionHeight };
}

/** Share of the symbol's modules covered by the logo box. */
export function qrLogoCoverage(moduleCount: number): number {
  const { logo } = qrLayout(moduleCount, true, false);
  return logo ? (logo.size * logo.size) / (moduleCount * moduleCount) : 0;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export function buildQrSvg(matrix: QrMatrix, options: QrSvgOptions): string {
  const n = matrix.size;
  const layout = qrLayout(n, Boolean(options.logo), Boolean(options.caption));
  const q = QR_QUIET_ZONE_MODULES;
  const inLogo = (row: number, col: number) =>
    layout.logo !== null &&
    row >= layout.logo.start &&
    row < layout.logo.start + layout.logo.size &&
    col >= layout.logo.start &&
    col < layout.logo.start + layout.logo.size;

  let path = '';
  for (let row = 0; row < n; row += 1) {
    let col = 0;
    while (col < n) {
      if (!matrix.get(row, col) || inLogo(row, col)) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < n && matrix.get(row, col) && !inLogo(row, col)) col += 1;
      path += `M${start + q} ${row + q}h${col - start}v1h-${col - start}z`;
    }
  }

  const height = Math.round((options.width * layout.height) / layout.side);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${options.width}" height="${height}" viewBox="0 0 ${layout.side} ${layout.height}" shape-rendering="crispEdges">`,
    `<rect width="${layout.side}" height="${layout.height}" fill="${options.background}"/>`,
    `<path fill="${options.foreground}" d="${path}"/>`,
  ];
  if (layout.logo && options.logo) {
    const inset = 0.5;
    const x = layout.logo.start + q + inset;
    const size = layout.logo.size - inset * 2;
    const href = escapeXml(options.logo);
    parts.push(
      `<image x="${x}" y="${x}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"/>`
    );
  }
  if (options.caption) {
    const fontSize = +(layout.side * CAPTION_FONT_RATIO).toFixed(2);
    const y = +(layout.side + layout.captionHeight / 2).toFixed(2);
    parts.push(
      `<text x="${layout.side / 2}" y="${y}" fill="${options.foreground}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" shape-rendering="geometricPrecision">${escapeXml(options.caption)}</text>`
    );
  }
  parts.push('</svg>');
  return parts.join('');
}

export function qrFileName(slug: string, format: 'png' | 'svg'): string {
  return `linketry-qr-${slug}.${format}`;
}
