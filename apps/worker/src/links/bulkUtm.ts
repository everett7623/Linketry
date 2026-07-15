export const BULK_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export const MAX_BULK_UTM_LINKS = 100;

export type BulkUtmKey = (typeof BULK_UTM_KEYS)[number];
export type BulkUtmMode = 'add_missing' | 'replace_selected' | 'remove_selected';

export interface BulkUtmPolicy {
  mode: BulkUtmMode;
  parameters: BulkUtmKey[];
  values: Partial<Record<BulkUtmKey, string>>;
}

export interface BulkUtmResult {
  status: 'ready' | 'unchanged' | 'invalid';
  nextUrl: string;
  conflicts: BulkUtmKey[];
  error?: string;
}

const MODES: BulkUtmMode[] = ['add_missing', 'replace_selected', 'remove_selected'];

function validateDestinationUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) return { valid: false, error: 'URL cannot be empty' };
  const normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function parseBulkUtmPolicy(
  modeValue: unknown,
  parameterValue: unknown,
  valueMap: unknown
): { policy?: BulkUtmPolicy; error?: string } {
  if (!MODES.includes(modeValue as BulkUtmMode)) return { error: 'Invalid bulk UTM mode' };
  if (!Array.isArray(parameterValue)) return { error: 'parameters must be a non-empty array' };

  const parameters = [...new Set(parameterValue)]
    .filter((key): key is BulkUtmKey => BULK_UTM_KEYS.includes(key as BulkUtmKey));
  if (
    parameters.length === 0 ||
    parameters.length !== parameterValue.length ||
    new Set(parameterValue).size !== parameterValue.length
  ) {
    return { error: 'parameters contains an unsupported or duplicate UTM key' };
  }

  const values: Partial<Record<BulkUtmKey, string>> = {};
  const source = valueMap && typeof valueMap === 'object'
    ? valueMap as Record<string, unknown>
    : {};
  if (modeValue !== 'remove_selected') {
    for (const key of parameters) {
      if (typeof source[key] !== 'string' || !source[key].trim()) {
        return { error: `${key} must not be empty for this mode` };
      }
      const value = source[key].trim();
      if (value.length > 500) return { error: `${key} cannot exceed 500 characters` };
      values[key] = value;
    }
  }

  return { policy: { mode: modeValue as BulkUtmMode, parameters, values } };
}

function decodedQueryKey(segment: string): string | null {
  const rawKey = segment.split('=', 1)[0].replace(/\+/g, ' ');
  try {
    return decodeURIComponent(rawKey);
  } catch {
    return null;
  }
}

export function applyBulkUtmPolicy(currentUrl: string, policy: BulkUtmPolicy): BulkUtmResult {
  const validation = validateDestinationUrl(currentUrl);
  if (!validation.valid) {
    return { status: 'invalid', nextUrl: currentUrl, conflicts: [], error: validation.error };
  }

  let parsed: URL;
  try {
    parsed = new URL(currentUrl);
  } catch {
    return { status: 'invalid', nextUrl: currentUrl, conflicts: [], error: 'Invalid URL format' };
  }
  if (parsed.username || parsed.password) {
    return {
      status: 'invalid',
      nextUrl: currentUrl,
      conflicts: [],
      error: 'Credentialed URLs are not supported by bulk UTM changes',
    };
  }

  const fragmentIndex = currentUrl.indexOf('#');
  const fragment = fragmentIndex >= 0 ? currentUrl.slice(fragmentIndex) : '';
  const withoutFragment = fragmentIndex >= 0 ? currentUrl.slice(0, fragmentIndex) : currentUrl;
  const queryIndex = withoutFragment.indexOf('?');
  const base = queryIndex >= 0 ? withoutFragment.slice(0, queryIndex) : withoutFragment;
  const rawQuery = queryIndex >= 0 ? withoutFragment.slice(queryIndex + 1) : '';
  const segments = rawQuery ? rawQuery.split('&') : [];
  const selected = new Set(policy.parameters);
  const occurrences = new Map<BulkUtmKey, number>();
  const decodedKeys: string[] = [];

  for (const segment of segments) {
    const key = decodedQueryKey(segment);
    if (key === null) {
      return {
        status: 'invalid',
        nextUrl: currentUrl,
        conflicts: [],
        error: 'URL contains a malformed query parameter encoding',
      };
    }
    decodedKeys.push(key);
    if (selected.has(key as BulkUtmKey)) {
      const typedKey = key as BulkUtmKey;
      occurrences.set(typedKey, (occurrences.get(typedKey) ?? 0) + 1);
    }
  }

  const conflicts = policy.parameters.filter((key) => (occurrences.get(key) ?? 0) > 1);
  if (
    policy.mode === 'remove_selected' &&
    policy.parameters.every((key) => (occurrences.get(key) ?? 0) === 0)
  ) {
    return { status: 'unchanged', nextUrl: currentUrl, conflicts };
  }
  const replaced = new Set<BulkUtmKey>();
  const nextSegments: string[] = [];

  segments.forEach((segment, index) => {
    const key = decodedKeys[index] as BulkUtmKey;
    if (!selected.has(key)) {
      nextSegments.push(segment);
      return;
    }
    if (policy.mode === 'remove_selected') return;
    if (policy.mode === 'add_missing') {
      nextSegments.push(segment);
      return;
    }
    if (!replaced.has(key)) {
      nextSegments.push(`${key}=${encodeURIComponent(policy.values[key] ?? '')}`);
      replaced.add(key);
    }
  });

  for (const key of policy.parameters) {
    const exists = (occurrences.get(key) ?? 0) > 0;
    const shouldAppend = policy.mode === 'add_missing' ? !exists : policy.mode === 'replace_selected' && !replaced.has(key);
    if (shouldAppend) nextSegments.push(`${key}=${encodeURIComponent(policy.values[key] ?? '')}`);
  }

  const nextUrl = `${base}${nextSegments.length > 0 ? `?${nextSegments.join('&')}` : ''}${fragment}`;
  const nextValidation = validateDestinationUrl(nextUrl);
  if (!nextValidation.valid) {
    return { status: 'invalid', nextUrl: currentUrl, conflicts, error: nextValidation.error };
  }
  return { status: nextUrl === currentUrl ? 'unchanged' : 'ready', nextUrl, conflicts };
}

export function bulkUtmCsv(
  rows: Array<{ id: string; slug: string; oldUrl: string; newUrl: string }>,
  policy: BulkUtmPolicy,
  changedAt: string
): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    'id,slug,old_url,new_url,mode,parameters,changed_at',
    ...rows.map((row) => [
      row.id,
      row.slug,
      row.oldUrl,
      row.newUrl,
      policy.mode,
      policy.parameters.join('|'),
      changedAt,
    ].map(escape).join(',')),
  ].join('\r\n');
}
