/**
 * Outbound URL safety for Worker-initiated fetches (metadata, health, webhooks).
 * Short-link destinations may still point at private hosts; only egress fetches use this.
 */

export type EgressValidationResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

export function assertSafeEgressUrl(raw: string): EgressValidationResult {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'Invalid egress URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Egress URL must use http or https' };
  }

  if (url.username || url.password) {
    return { ok: false, error: 'Egress URL must not include credentials' };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname) {
    return { ok: false, error: 'Egress URL host is required' };
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return { ok: false, error: 'Egress to local or metadata hosts is not allowed' };
  }

  if (isBlockedIpLiteral(hostname)) {
    return { ok: false, error: 'Egress to private or link-local addresses is not allowed' };
  }

  return { ok: true, url };
}

export async function safeEgressFetch(
  raw: string,
  init: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  let current = raw;
  let redirects = 0;

  while (true) {
    const validated = assertSafeEgressUrl(current);
    if (!validated.ok) {
      throw new Error(validated.error);
    }

    const response = await fetch(validated.url.toString(), {
      ...init,
      redirect: 'manual',
    });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get('Location');
    if (!location) {
      return response;
    }

    redirects += 1;
    if (redirects > maxRedirects) {
      throw new Error('Too many redirects while fetching egress URL');
    }

    current = new URL(location, validated.url).toString();
  }
}

function isBlockedIpLiteral(hostname: string): boolean {
  if (hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') return true;

  if (hostname.includes(':')) {
    const normalized = hostname.toLowerCase();
    if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80')) {
      return true;
    }
    return false;
  }

  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}
