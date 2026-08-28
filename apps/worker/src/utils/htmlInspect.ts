/**
 * Bounded HTML fetch for Admin-initiated URL inspection (title, suggestions, preview).
 *
 * Wraps `safeEgressFetch` (SSRF egress guard + redirect re-validation) and caps the
 * response body to a fixed byte budget before it reaches `HTMLRewriter` / `.text()`,
 * so a hostile page that omits `Content-Length` and streams megabytes cannot exhaust
 * Worker memory.
 */

import { assertSafeEgressUrl, safeEgressFetch } from './egress';

export const DEFAULT_HTML_INSPECT_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 6000;

export type BoundedHtml =
  | { ok: true; finalUrl: string; response: Response }
  | { ok: false; error: string; status: number };

interface FetchBoundedHtmlOptions {
  userAgent: string;
  timeoutMs?: number;
  maxBytes?: number;
}

export async function fetchBoundedHtml(
  url: string,
  { userAgent, timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_HTML_INSPECT_BYTES }: FetchBoundedHtmlOptions
): Promise<BoundedHtml> {
  const egress = assertSafeEgressUrl(url);
  if (!egress.ok) return { ok: false, error: egress.error, status: 400 };

  let response: Response;
  try {
    response = await safeEgressFetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'User-Agent': userAgent,
      },
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unable to fetch URL', status: 400 };
  }

  if (!response.ok) {
    return { ok: false, error: `Target URL returned HTTP ${response.status}`, status: 400 };
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType && !/\b(html|xhtml|xml)\b/i.test(contentType)) {
    return { ok: false, error: 'Target URL did not return an HTML page', status: 400 };
  }

  const declaredLength = Number(response.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, error: 'Target page is too large to inspect', status: 400 };
  }

  const finalUrl = response.url || url;
  const bounded = new Response(capBody(response.body, maxBytes), {
    headers: contentType ? { 'Content-Type': contentType } : undefined,
  });
  return { ok: true, finalUrl, response: bounded };
}

/** Streams at most `maxBytes` from `body`, then closes and cancels the source. */
function capBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): ReadableStream<Uint8Array> | null {
  if (!body) return null;
  const reader = body.getReader();
  let sent = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (sent >= maxBytes) {
        controller.close();
        await reader.cancel().catch(() => undefined);
        return;
      }
      const { done, value } = await reader.read();
      if (done || !value) {
        controller.close();
        return;
      }
      const remaining = maxBytes - sent;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      sent += chunk.byteLength;
      controller.enqueue(chunk);
      if (sent >= maxBytes) {
        controller.close();
        await reader.cancel().catch(() => undefined);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
    },
  });
}
