import { QR_LOGO_MAX_BYTES, QR_LOGO_MAX_PIXELS } from '@linketry/shared';
import { buildQrSvg, qrErrorCorrection, type QrSvgOptions } from './qrCode';

export async function createQrSvg(url: string, options: QrSvgOptions): Promise<string> {
  const { default: qrcode } = await import('qrcode');
  const symbol = qrcode.create(url, { errorCorrectionLevel: qrErrorCorrection(Boolean(options.logo)) });
  return buildQrSvg(symbol.modules, options);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = src;
  });
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function rasterizeSvg(svg: string): Promise<HTMLCanvasElement> {
  const image = await loadImage(svgDataUrl(svg));
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png');
  });
}

/** Loads the decoder chunk on demand; resolves to null when the chunk cannot be fetched. */
export async function loadQrDecoder(): Promise<((canvas: HTMLCanvasElement) => string | null) | null> {
  try {
    const { default: jsQR } = await import('jsqr');
    return (canvas) => {
      const context = canvas.getContext('2d');
      if (!context) return null;
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null;
    };
  } catch {
    return null;
  }
}

export class QrLogoError extends Error {
  constructor(readonly reason: 'unreadable' | 'too_large') {
    super(reason);
  }
}

/**
 * Rasterises any browser-readable image (including SVG, which never runs scripts inside <img>)
 * to a PNG data URL that fits the stored-logo limits.
 */
export async function prepareQrLogo(file: File): Promise<string> {
  const source = URL.createObjectURL(file);
  let image: HTMLImageElement;
  try {
    image = await loadImage(source);
  } catch {
    throw new QrLogoError('unreadable');
  } finally {
    URL.revokeObjectURL(source);
  }
  const width = image.naturalWidth || QR_LOGO_MAX_PIXELS;
  const height = image.naturalHeight || QR_LOGO_MAX_PIXELS;
  for (const limit of [QR_LOGO_MAX_PIXELS, 192, 128, 96]) {
    const scale = Math.min(1, limit / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new QrLogoError('unreadable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length <= QR_LOGO_MAX_BYTES) return dataUrl;
  }
  throw new QrLogoError('too_large');
}
