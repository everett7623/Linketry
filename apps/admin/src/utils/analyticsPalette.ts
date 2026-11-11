export const GLOBAL_DISTRIBUTION_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-orange-500',
  'bg-fuchsia-500',
  'bg-teal-500',
] as const;

/** Tailwind CSS v4 OKLCH steps used by the world-map intensity ramp (teal → amber). */
export const WORLD_TRAFFIC_COLORS = [
  'oklch(60% 0.118 184.704)', // teal-600
  'oklch(71.5% 0.143 215.221)', // cyan-500
  'oklch(68.5% 0.169 237.323)', // sky-500
  'oklch(62.3% 0.214 259.815)', // blue-500
  'oklch(51.1% 0.262 276.966)', // indigo-600
  'oklch(54.1% 0.281 293.009)', // violet-600
  'oklch(59.1% 0.293 322.896)', // fuchsia-600
  'oklch(58.6% 0.253 17.585)', // rose-600
  'oklch(64.6% 0.222 41.116)', // orange-600
  'oklch(76.9% 0.188 70.08)', // amber-500
] as const;

const WORLD_TRAFFIC_EMPTY = 'oklch(27.9% 0.041 260.031)'; // slate-800

export function globalDistributionColor(index: number): string {
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return GLOBAL_DISTRIBUTION_COLORS[normalizedIndex % GLOBAL_DISTRIBUTION_COLORS.length];
}

export function worldTrafficColor(value: number, max: number): string {
  if (value <= 0) return WORLD_TRAFFIC_EMPTY;
  const ratio = Math.min(1, value / Math.max(max, 1));
  const index = Math.min(WORLD_TRAFFIC_COLORS.length - 1, Math.ceil(ratio * 10) - 1);
  return WORLD_TRAFFIC_COLORS[index];
}
