export function readExpectedUpgradeVersion(body: unknown): string | null {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = (body as { expectedVersion?: unknown }).expectedVersion;
  return typeof value === 'string' ? value : null;
}
