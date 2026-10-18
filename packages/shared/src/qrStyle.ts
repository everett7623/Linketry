export const QR_STYLE_SIZES = [512, 1024, 2048] as const;
export const QR_STYLE_FORMATS = ['png', 'svg'] as const;

export type QrStyleSize = (typeof QR_STYLE_SIZES)[number];
export type QrStyleFormat = (typeof QR_STYLE_FORMATS)[number];

export interface QrStyle {
  foreground: string;
  background: string;
  /** PNG data URL, already downscaled in the browser; never SVG. */
  logo: string | null;
  caption: boolean;
  size: QrStyleSize;
  format: QrStyleFormat;
}

export const DEFAULT_QR_STYLE: QrStyle = {
  foreground: '#020617',
  background: '#ffffff',
  logo: null,
  caption: false,
  size: 1024,
  format: 'png',
};

export const QR_MIN_CONTRAST = 4.5;
/** Error correction H restores ~30 % damage; 20 % keeps a margin for print defects. */
export const QR_LOGO_MAX_AREA_RATIO = 0.2;
export const QR_LOGO_MAX_PIXELS = 256;
export const QR_LOGO_MAX_BYTES = 48 * 1024;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type QrColorIssue = 'invalid_color' | 'inverted' | 'low_contrast';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function checkQrColors(foreground: string, background: string): QrColorIssue | null {
  if (!HEX_COLOR.test(foreground) || !HEX_COLOR.test(background)) return 'invalid_color';
  if (relativeLuminance(foreground) >= relativeLuminance(background)) return 'inverted';
  if (contrastRatio(foreground, background) < QR_MIN_CONTRAST) return 'low_contrast';
  return null;
}

/** Reads width and height from the IHDR chunk; null when the data URL is not a PNG. */
export function readPngDataUrlSize(dataUrl: string): { width: number; height: number } | null {
  if (!dataUrl.startsWith(PNG_DATA_URL_PREFIX)) return null;
  const base64 = dataUrl.slice(PNG_DATA_URL_PREFIX.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length < 32) return null;
  let head: string;
  try {
    head = atob(base64.slice(0, 32));
  } catch {
    return null;
  }
  const bytes = Array.from(head, (ch) => ch.charCodeAt(0));
  if (PNG_SIGNATURE.some((byte, i) => bytes[i] !== byte)) return null;
  if (String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') return null;
  const read32 = (offset: number) =>
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  return { width: read32(16), height: read32(20) };
}

export type QrStyleValidation = { valid: true; style: QrStyle } | { valid: false; error: string };

export function validateQrStyle(input: unknown): QrStyleValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'QR style must be an object' };
  }
  const value = input as Record<string, unknown>;
  const allowed = new Set(Object.keys(DEFAULT_QR_STYLE));
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) return { valid: false, error: `Unknown QR style field: ${unknown}` };

  const { foreground, background, logo, caption, size, format } = value;
  if (typeof foreground !== 'string' || typeof background !== 'string') {
    return { valid: false, error: 'foreground and background must be #rrggbb colours' };
  }
  const colorIssue = checkQrColors(foreground, background);
  if (colorIssue === 'invalid_color') {
    return { valid: false, error: 'foreground and background must be #rrggbb colours' };
  }
  if (colorIssue === 'inverted') {
    return { valid: false, error: 'foreground must be darker than background' };
  }
  if (colorIssue === 'low_contrast') {
    return { valid: false, error: `foreground and background contrast must be at least ${QR_MIN_CONTRAST}:1` };
  }
  if (logo !== null && typeof logo !== 'string') {
    return { valid: false, error: 'logo must be a PNG data URL or null' };
  }
  if (typeof logo === 'string') {
    if (logo.length > QR_LOGO_MAX_BYTES) {
      return { valid: false, error: `logo must be at most ${QR_LOGO_MAX_BYTES / 1024} kB` };
    }
    const dimensions = readPngDataUrlSize(logo);
    if (!dimensions) return { valid: false, error: 'logo must be a PNG data URL' };
    if (
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width > QR_LOGO_MAX_PIXELS ||
      dimensions.height > QR_LOGO_MAX_PIXELS
    ) {
      return { valid: false, error: `logo must be at most ${QR_LOGO_MAX_PIXELS}×${QR_LOGO_MAX_PIXELS} px` };
    }
  }
  if (typeof caption !== 'boolean') return { valid: false, error: 'caption must be true or false' };
  if (!QR_STYLE_SIZES.includes(size as QrStyleSize)) {
    return { valid: false, error: `size must be one of ${QR_STYLE_SIZES.join(', ')}` };
  }
  if (!QR_STYLE_FORMATS.includes(format as QrStyleFormat)) {
    return { valid: false, error: 'format must be png or svg' };
  }
  return {
    valid: true,
    style: {
      foreground: foreground.toLowerCase(),
      background: background.toLowerCase(),
      logo: logo ?? null,
      caption,
      size: size as QrStyleSize,
      format: format as QrStyleFormat,
    },
  };
}

/** Parses a stored value, falling back to the standard style when it is missing or no longer valid. */
export function parseStoredQrStyle(raw: string | undefined | null): QrStyle {
  if (!raw) return { ...DEFAULT_QR_STYLE };
  try {
    const result = validateQrStyle(JSON.parse(raw));
    return result.valid ? result.style : { ...DEFAULT_QR_STYLE };
  } catch {
    return { ...DEFAULT_QR_STYLE };
  }
}
