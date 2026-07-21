import type { AnalyticsSummary } from '../../api/analytics';

export type TrendPoint = AnalyticsSummary['daily'][number];
export type ChartPoint = TrendPoint & {
  x: number;
  clicksY: number;
  humanY: number;
  botY: number;
  uniqueY: number;
};

export const CHART_WIDTH = 900;
export const CHART_HEIGHT = 270;
export const CHART_PLOT = { left: 48, right: 16, top: 18, bottom: 34 };

export function chartPoints(items: TrendPoint[], max: number): ChartPoint[] {
  return items.map((item, index) => ({
    ...item,
    x: pointX(index, items.length),
    clicksY: pointY(item.clicks, max),
    humanY: pointY(item.humanClicks, max),
    botY: pointY(item.botClicks, max),
    uniqueY: pointY(item.uniqueVisitors, max),
  }));
}

export function pointX(index: number, count: number): number {
  return CHART_PLOT.left + (count <= 1 ? plotWidth() / 2 : (index / (count - 1)) * plotWidth());
}

export function plotWidth(): number {
  return CHART_WIDTH - CHART_PLOT.left - CHART_PLOT.right;
}

export function plotHeight(): number {
  return CHART_HEIGHT - CHART_PLOT.top - CHART_PLOT.bottom;
}

export function smoothPath(
  points: ChartPoint[],
  key: 'clicksY' | 'humanY' | 'botY' | 'uniqueY'
): string {
  if (points.length === 0) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middle = (previous.x + point.x) / 2;
    return `${path}C${middle} ${previous[key]},${middle} ${point[key]},${point.x} ${point[key]}`;
  }, `M${points[0].x} ${points[0][key]}`);
}

export function areaPath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  const baseline = CHART_PLOT.top + plotHeight();
  return `${smoothPath(points, 'clicksY')}L${points[points.length - 1].x} ${baseline}L${points[0].x} ${baseline}Z`;
}

function pointY(value: number, max: number): number {
  return CHART_PLOT.top + (1 - value / max) * plotHeight();
}
