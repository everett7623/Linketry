import { LINKETRY_VERSION } from '@linketry/shared';
import type { Env } from '../types';

function firstConfigured(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value?.trim());
}

export function getAdminToken(env: Env): string {
  return firstConfigured(env.LINKETRY_ADMIN_TOKEN, env.ADMIN_TOKEN) ?? '';
}

export function getRuntimeVersion(env: Env): string {
  return firstConfigured(env.LINKETRY_VERSION, env.LINKORA_VERSION) ?? LINKETRY_VERSION;
}

export function getDailyCron(env: Env, fallback: string): string {
  return firstConfigured(env.LINKETRY_DAILY_CRON, env.LINKORA_DAILY_CRON) ?? fallback;
}

export function getHealthCron(env: Env): string | undefined {
  return firstConfigured(env.LINKETRY_HEALTH_CRON, env.LINKORA_HEALTH_CRON);
}
