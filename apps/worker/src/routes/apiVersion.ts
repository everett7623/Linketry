export const API_V1_PREFIX = '/api/v1';
export const LEGACY_API_PREFIX = '/api';
export const API_ROUTE_PREFIXES = [API_V1_PREFIX, LEGACY_API_PREFIX] as const;

export function isLegacyApiPath(path: string): boolean {
  return (
    (path === LEGACY_API_PREFIX || path.startsWith(`${LEGACY_API_PREFIX}/`)) &&
    path !== API_V1_PREFIX &&
    !path.startsWith(`${API_V1_PREFIX}/`)
  );
}
