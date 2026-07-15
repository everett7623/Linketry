export async function resolvePageTitle(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Linketry/1.0 title resolver',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const text = await response.text();
    const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) return null;

    return decodeHtmlEntities(match[1].trim()) || null;
  } catch {
    return null;
  }
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
