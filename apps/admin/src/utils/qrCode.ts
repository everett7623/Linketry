/** QR Code Model 2 requires a light border of at least four modules on every side. */
export const QR_QUIET_ZONE_MODULES = 4;

export const DEFAULT_QR_COLORS = { dark: '#020617', light: '#ffffff' } as const;

export function qrRenderOptions(width = 320) {
  return {
    width,
    margin: QR_QUIET_ZONE_MODULES,
    errorCorrectionLevel: 'M' as const,
    color: { ...DEFAULT_QR_COLORS },
  };
}
