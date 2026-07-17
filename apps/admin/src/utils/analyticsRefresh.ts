export const ANALYTICS_REFRESH_INTERVALS = [5, 10, 30] as const;
export type AnalyticsRefreshInterval = (typeof ANALYTICS_REFRESH_INTERVALS)[number];

export function normalizeAnalyticsRefreshInterval(
  value: string | number | null | undefined
): AnalyticsRefreshInterval {
  const parsed = Number(value);
  return ANALYTICS_REFRESH_INTERVALS.includes(parsed as AnalyticsRefreshInterval)
    ? (parsed as AnalyticsRefreshInterval)
    : 10;
}
