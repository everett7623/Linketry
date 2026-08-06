import type { Context } from 'hono';
import type { Env } from '../types';

export function resolveCorsOrigin(c: Context<{ Bindings: Env }>): string {
  if (c.env.LINKETRY_DEMO_MODE?.trim().toLowerCase() === 'read-only') {
    return '*';
  }

  const configured = c.env.LINKETRY_CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!configured || configured.length === 0) {
    console.warn(
      JSON.stringify({
        message: 'LINKETRY_CORS_ORIGINS unset; falling back to *',
      })
    );
    return '*';
  }

  const requestOrigin = c.req.header('Origin');
  if (requestOrigin && configured.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Reflect first allowlisted origin for non-browser or missing Origin.
  return configured[0]!;
}
