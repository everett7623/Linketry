const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'health',
  'login',
  'settings',
  'assets',
  'static',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'Slug cannot be empty' };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return { valid: false, error: 'Slug can only contain letters, numbers, hyphens, and underscores' };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { valid: false, error: `"${slug}" is a reserved path and cannot be used as a slug` };
  }
  if (slug.length > 100) {
    return { valid: false, error: 'Slug cannot exceed 100 characters' };
  }
  return { valid: true };
}

export function validateLongUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:')) {
    return { valid: false, error: 'javascript: URLs are not allowed' };
  }
  if (trimmed.startsWith('data:')) {
    return { valid: false, error: 'data: URLs are not allowed' };
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  return { valid: true };
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function normalizeDomain(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '').toLowerCase();
}

export function validateDomain(value: string): { valid: boolean; error?: string; domain?: string } {
  const domain = normalizeDomain(value);
  if (!domain) return { valid: false, error: 'Domain cannot be empty' };
  if (domain.includes('/') || domain.includes('?') || domain.includes('#')) {
    return { valid: false, error: 'Domain must not include a path, query, or fragment' };
  }
  if (domain.length > 253) return { valid: false, error: 'Domain cannot exceed 253 characters' };
  if (!/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(domain)) {
    return { valid: false, error: 'Domain contains invalid characters' };
  }
  const host = domain.split(':')[0];
  if (host.split('.').some((label) => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'))) {
    return { valid: false, error: 'Domain label is invalid' };
  }
  return { valid: true, domain };
}
