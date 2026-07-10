export const DEFAULT_HEALTH_MONITORING_LIMIT = 20;

export function parseHealthMonitoringEnabled(value?: string): boolean {
  return value === 'true';
}

export function normalizeHealthMonitoringLimit(value?: string): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_HEALTH_MONITORING_LIMIT), 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 50
    ? parsed
    : DEFAULT_HEALTH_MONITORING_LIMIT;
}
