export type CsvRecord = Record<string, string>;

export function parseCsvRows(input: string): string[][] {
  const source = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const finishRow = () => {
    row.push(field.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
    row = [];
    field = '';
  };

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index++;
      finishRow();
      continue;
    }
    if (char === '\r' && quoted && next === '\n') {
      field += '\n';
      index++;
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) finishRow();
  return rows;
}

export function parseCsvRecords(input: string): CsvRecord[] {
  const [headers, ...rows] = parseCsvRows(input);
  if (!headers || headers.length === 0) return [];

  return rows.map((values) => {
    const record: CsvRecord = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
}

function csvHeaders(input: string): string[] {
  return parseCsvRows(input)[0] ?? [];
}

export interface MainstreamImportItem {
  slug: string;
  longUrl: string;
  domain?: string;
  shortUrl?: string;
  title?: string;
  tags?: string[];
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
  source: 'bitly-csv' | 'shortio-csv';
  sourceId?: string;
  status?: 'active' | 'archived';
  expiresAt?: string | null;
  archived?: number;
  raw: CsvRecord;
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizedHeaders(input: string): Set<string> {
  return new Set(csvHeaders(input).map(normalizeHeader));
}

function hasHeaders(headers: Set<string>, required: string[]): boolean {
  return required.every((header) => headers.has(normalizeHeader(header)));
}

function hasAnyHeader(headers: Set<string>, aliases: string[]): boolean {
  return aliases.some((header) => headers.has(normalizeHeader(header)));
}

function readValue(row: CsvRecord, aliases: string[]): string | undefined {
  const entries = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const alias of aliases) {
    const value = entries.get(normalizeHeader(alias));
    if (value !== undefined && value.trim()) return value.trim();
  }
  return undefined;
}

function asCount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[\s,]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : undefined;
}

function asTags(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(/[,|;]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
}

function webUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    try {
      parsed = new URL(`https://${value.replace(/^\/+/, '')}`);
    } catch {
      return undefined;
    }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
  if (!parsed.hostname || parsed.username || parsed.password) return undefined;
  return parsed;
}

function normalizedShortUrl(value: string | undefined): string | undefined {
  return webUrl(value)?.toString();
}

function domainFromShortUrl(value: string | undefined): string | undefined {
  return webUrl(value)?.hostname.toLowerCase() || undefined;
}

function slugFromUrl(value: string | undefined): string {
  const url = webUrl(value);
  return url ? url.pathname.replace(/^\/+|\/+$/g, '') : '';
}

function bitlyShortUrl(row: CsvRecord): string | undefined {
  const standard = readValue(row, ['Link']);
  const custom = readValue(row, ['Custom Link']);
  if (!custom) return normalizedShortUrl(standard);

  const customUrl = normalizedShortUrl(custom);
  if (customUrl && (custom.includes('.') || custom.includes('/'))) return customUrl;

  const standardUrl = webUrl(standard);
  if (!standardUrl) return customUrl;
  standardUrl.pathname = `/${custom.replace(/^\/+/, '')}`;
  return standardUrl.toString();
}

function bitlyStatus(row: CsvRecord): Pick<MainstreamImportItem, 'status' | 'archived'> {
  const status = readValue(row, ['Status'])?.toLowerCase();
  if (status === 'deleted') return { status: 'archived', archived: 1 };
  if (status === 'active') return { status: 'active', archived: 0 };
  return {};
}

function normalizeBitlyRow(row: CsvRecord): MainstreamImportItem {
  const shortUrl = bitlyShortUrl(row);
  return {
    slug: slugFromUrl(shortUrl),
    longUrl: readValue(row, ['Destination URL']) ?? '',
    domain: domainFromShortUrl(shortUrl),
    shortUrl,
    title: readValue(row, ['Title']),
    clicks: asCount(readValue(row, ['Engagements'])),
    createdAt: readValue(row, ['Date created']),
    source: 'bitly-csv',
    sourceId: readValue(row, ['Link']) ?? shortUrl,
    ...bitlyStatus(row),
    raw: row,
  };
}

function normalizeShortIoRow(row: CsvRecord): MainstreamImportItem {
  const shortUrl = normalizedShortUrl(readValue(row, ['shortURL', 'short URL', 'short URLs']));
  const sourcePath = readValue(row, ['originalPath', 'original path', 'original paths', 'path']);
  return {
    slug: sourcePath?.replace(/^\/+|\/+$/g, '') ?? slugFromUrl(shortUrl),
    longUrl: readValue(row, ['originalURL', 'original URL', 'original URLs']) ?? '',
    domain: domainFromShortUrl(shortUrl),
    shortUrl,
    title: readValue(row, ['title', 'titles']),
    tags: asTags(readValue(row, ['tags'])),
    clicks: asCount(readValue(row, ['clicks'])),
    createdAt: readValue(row, ['createdAt', 'created at', 'created at (date)']),
    updatedAt: readValue(row, ['updatedAt', 'updated at', 'updated at (date)']),
    expiresAt: readValue(row, ['expiresAt', 'expires at', 'expires at (date)']) ?? null,
    source: 'shortio-csv',
    sourceId: readValue(row, ['idString', 'ID string', 'ID strings', 'id']),
    raw: row,
  };
}

export function detectBitlyCsv(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const headers = normalizedHeaders(input);
  return hasHeaders(headers, [
    'Link',
    'Custom Link',
    'Date created',
    'Destination URL',
    'Engagements',
    'Status',
  ]);
}

export function parseBitlyCsv(input: unknown): MainstreamImportItem[] {
  return typeof input === 'string' ? parseCsvRecords(input).map(normalizeBitlyRow) : [];
}

export function detectShortIoCsv(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const headers = normalizedHeaders(input);
  return (
    hasAnyHeader(headers, ['idString', 'ID strings']) &&
    hasAnyHeader(headers, ['shortURL', 'short URLs']) &&
    hasAnyHeader(headers, ['originalURL', 'original URLs']) &&
    hasAnyHeader(headers, ['originalPath', 'original paths', 'createdAt', 'created at']) &&
    headers.has('clicks')
  );
}

export function parseShortIoCsv(input: unknown): MainstreamImportItem[] {
  return typeof input === 'string' ? parseCsvRecords(input).map(normalizeShortIoRow) : [];
}
