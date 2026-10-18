import type { QrStyle } from '@linketry/shared';
import { apiGet, apiPut } from './client';

export function getQrStyle(): Promise<QrStyle> {
  return apiGet('/api/v1/qr-style');
}

export function saveQrStyle(style: QrStyle): Promise<QrStyle> {
  return apiPut('/api/v1/qr-style', style);
}
