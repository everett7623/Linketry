const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:']);

export type NormalizedDestination = {
  normalizedUrl: string;
  originPrefix: string;
};

export function normalizeDestinationUrl(value: string): NormalizedDestination | null {
  try {
    const url = new URL(value.trim());
    if (!SUPPORTED_PROTOCOLS.has(url.protocol)) return null;
    url.username = '';
    url.password = '';
    url.searchParams.sort();
    return { normalizedUrl: url.href, originPrefix: url.origin };
  } catch {
    return null;
  }
}
