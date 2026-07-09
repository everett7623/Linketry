export function normalizeDomain(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function domainFromUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    return normalizeDomain(new URL(value).hostname);
  } catch {
    return undefined;
  }
}
