import { assertSafeEgressUrl, safeEgressFetch } from './egress';

const MAX_TITLE_BYTES = 256 * 1024;

export async function resolvePageTitle(url: string, timeoutMs = 5000): Promise<string | null> {
  if (!assertSafeEgressUrl(url).ok) return null;

  try {
    const response = await safeEgressFetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Linketry/1.0 title resolver',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const declaredLength = Number(response.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_TITLE_BYTES) return null;

    const text = await readBoundedText(response, MAX_TITLE_BYTES);
    const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) return null;

    return decodeHtmlEntities(match[1].trim()) || null;
  } catch {
    return null;
  }
}

/** Stops reading once the title is available so a hostile page cannot stream unbounded bytes. */
async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let text = '';
  let read = 0;

  try {
    while (read < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (/<\/title>/i.test(text)) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return text;
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  return value
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      if (entities[entity]) return entities[entity];
      if (entity.startsWith('&#x')) {
        const code = parseInt(entity.slice(3, -1), 16);
        if (!Number.isNaN(code)) return String.fromCodePoint(code);
      }
      if (entity.startsWith('&#')) {
        const code = parseInt(entity.slice(2, -1), 10);
        if (!Number.isNaN(code)) return String.fromCodePoint(code);
      }
      return entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}
