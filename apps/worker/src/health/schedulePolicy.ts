export const DEFAULT_DAILY_CRON = '0 18 * * *';
export const DEFAULT_HEALTH_CRON = '0 * * * *';

export function scheduledWorkForCron(
  cron: string,
  dailyCron = DEFAULT_DAILY_CRON,
  healthCron?: string
): { daily: boolean; health: boolean } {
  return {
    daily: cron === dailyCron,
    health: cron === (healthCron ?? dailyCron),
  };
}
