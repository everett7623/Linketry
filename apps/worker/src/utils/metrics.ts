/**
 * 性能监控工具
 * 记录关键性能指标用于分析和告警
 */

export interface PerformanceMetrics {
  timestamp: number;
  type: 'redirect' | 'api' | 'cache' | 'db';
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface RedirectMetrics {
  redirectTime: number;
  kvHit: boolean;
  kvQueryTime?: number;
  d1QueryTime?: number;
  cacheUpdateTime?: number;
  visitRecordTime?: number;
}

/**
 * 性能阈值配置
 */
const THRESHOLDS = {
  redirect: {
    critical: 500, // 500ms
    warning: 200   // 200ms
  },
  d1Query: {
    critical: 300, // 300ms
    warning: 100   // 100ms
  },
  kvQuery: {
    critical: 100, // 100ms
    warning: 50    // 50ms
  },
  api: {
    critical: 1000, // 1s
    warning: 500    // 500ms
  }
};

/**
 * 记录性能指标
 */
export function recordMetrics(metrics: PerformanceMetrics): void {
  console.log(JSON.stringify({
    ...metrics,
    timestamp: Date.now(),
    level: 'metrics'
  }));
}

/**
 * 记录重定向性能
 */
export function recordRedirectMetrics(metrics: RedirectMetrics): void {
  const { redirectTime, kvHit, kvQueryTime, d1QueryTime } = metrics;

  recordMetrics({
    timestamp: Date.now(),
    type: 'redirect',
    operation: 'redirect',
    duration: redirectTime,
    success: true,
    metadata: {
      kvHit,
      kvQueryTime,
      d1QueryTime
    }
  });

  // 检查性能阈值并告警
  checkRedirectPerformance(metrics);
}

/**
 * 检查重定向性能并告警
 */
function checkRedirectPerformance(metrics: RedirectMetrics): void {
  const alerts: string[] = [];

  // 检查总重定向时间
  if (metrics.redirectTime > THRESHOLDS.redirect.critical) {
    alerts.push(`CRITICAL: Redirect time ${metrics.redirectTime}ms > ${THRESHOLDS.redirect.critical}ms`);
  } else if (metrics.redirectTime > THRESHOLDS.redirect.warning) {
    alerts.push(`WARNING: Redirect time ${metrics.redirectTime}ms > ${THRESHOLDS.redirect.warning}ms`);
  }

  // 检查 D1 查询时间
  if (metrics.d1QueryTime && metrics.d1QueryTime > THRESHOLDS.d1Query.critical) {
    alerts.push(`CRITICAL: D1 query time ${metrics.d1QueryTime}ms > ${THRESHOLDS.d1Query.critical}ms`);
  } else if (metrics.d1QueryTime && metrics.d1QueryTime > THRESHOLDS.d1Query.warning) {
    alerts.push(`WARNING: D1 query time ${metrics.d1QueryTime}ms > ${THRESHOLDS.d1Query.warning}ms`);
  }

  // 检查 KV 查询时间
  if (metrics.kvQueryTime && metrics.kvQueryTime > THRESHOLDS.kvQuery.critical) {
    alerts.push(`CRITICAL: KV query time ${metrics.kvQueryTime}ms > ${THRESHOLDS.kvQuery.critical}ms`);
  }

  // 如果有告警，记录日志
  if (alerts.length > 0) {
    console.warn('Performance alerts:', JSON.stringify({
      alerts,
      metrics,
      timestamp: Date.now()
    }));
  }
}

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * 标记时间点
   */
  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  /**
   * 获取从开始到现在的时间
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 获取两个标记之间的时间差
   */
  measure(startMark: string, endMark: string): number | null {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) return null;
    return end - start;
  }

  /**
   * 获取从标记到现在的时间
   */
  since(mark: string): number | null {
    const time = this.marks.get(mark);
    if (!time) return null;
    return Date.now() - time;
  }

  /**
   * 获取所有指标
   */
  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {
      total: this.elapsed()
    };

    for (const [name, time] of this.marks.entries()) {
      metrics[name] = time - this.startTime;
    }

    return metrics;
  }
}

/**
 * 记录 API 性能
 */
export function recordAPIMetrics(
  operation: string,
  duration: number,
  success: boolean,
  statusCode?: number
): void {
  recordMetrics({
    timestamp: Date.now(),
    type: 'api',
    operation,
    duration,
    success,
    metadata: { statusCode }
  });

  // 检查 API 性能
  if (duration > THRESHOLDS.api.critical) {
    console.warn(`CRITICAL: API ${operation} took ${duration}ms > ${THRESHOLDS.api.critical}ms`);
  } else if (duration > THRESHOLDS.api.warning) {
    console.warn(`WARNING: API ${operation} took ${duration}ms > ${THRESHOLDS.api.warning}ms`);
  }
}

/**
 * 记录数据库操作性能
 */
export function recordDBMetrics(
  operation: string,
  duration: number,
  success: boolean,
  rowCount?: number
): void {
  recordMetrics({
    timestamp: Date.now(),
    type: 'db',
    operation,
    duration,
    success,
    metadata: { rowCount }
  });
}

/**
 * 记录缓存操作性能
 */
export function recordCacheMetrics(
  operation: string,
  duration: number,
  hit: boolean
): void {
  recordMetrics({
    timestamp: Date.now(),
    type: 'cache',
    operation,
    duration,
    success: hit,
    metadata: { hit }
  });
}

/**
 * 计算 KV 命中率（需要在应用层聚合）
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export function calculateCacheStats(hits: number, misses: number): CacheStats {
  const total = hits + misses;
  const hitRate = total > 0 ? (hits / total) * 100 : 0;

  return { hits, misses, hitRate };
}
