import { createPerformanceMetric } from '../api/analytics';

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  // Start timing for a metric
  startTiming(metricName: string): void {
    this.metrics.set(metricName, Date.now());
  }

  // End timing and record metric
  async endTiming(
    metricName: string,
    metricType: string,
    context?: {
      screenName?: string;
      endpoint?: string;
      unit?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const startTime = this.metrics.get(metricName);
    if (!startTime) {
      console.warn(`No start time found for metric: ${metricName}`);
      return;
    }

    const duration = Date.now() - startTime;
    this.metrics.delete(metricName);

    await this.recordMetric({
      metric_name: metricName,
      metric_type: metricType,
      value: duration,
      unit: context?.unit || 'ms',
      screen_name: context?.screenName,
      endpoint: context?.endpoint,
      device_info: context?.metadata as any,
    });
  }

  // Record a metric directly
  async recordMetric(metric: {
    metric_name: string;
    metric_type: string;
    value?: number;
    unit?: string;
    screen_name?: string;
    endpoint?: string;
    load_time_ms?: number;
    response_time_ms?: number;
    memory_usage_mb?: number;
    device_info?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await createPerformanceMetric({
        ...metric,
        device_info: metric.device_info as any,
        metadata: metric.metadata as any,
      });
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  // Measure API call performance
  async measureApiCall<T>(
    endpoint: string,
    fn: () => Promise<T>,
    context?: { screenName?: string }
  ): Promise<T> {
    const metricName = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    this.startTiming(metricName);

    try {
      const result = await fn();
      const duration = Date.now() - (this.metrics.get(metricName) || Date.now());
      
      await this.recordMetric({
        metric_name: metricName,
        metric_type: 'api_call',
        value: duration,
        unit: 'ms',
        endpoint,
        screen_name: context?.screenName,
        response_time_ms: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - (this.metrics.get(metricName) || Date.now());
      
      await this.recordMetric({
        metric_name: metricName,
        metric_type: 'api_call',
        value: duration,
        unit: 'ms',
        endpoint,
        screen_name: context?.screenName,
        response_time_ms: duration,
        metadata: { error: true },
      });

      throw error;
    } finally {
      this.metrics.delete(metricName);
    }
  }

  // Measure screen load time
  async measureScreenLoad(
    screenName: string,
    loadTime: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      metric_name: `screen_load_${screenName}`,
      metric_type: 'screen_load',
      value: loadTime,
      unit: 'ms',
      screen_name: screenName,
      load_time_ms: loadTime,
      device_info: context as any,
    });
  }

  // Measure memory usage
  async measureMemoryUsage(context?: { screenName?: string }): Promise<void> {
    try {
      // @ts-ignore - React Native performance API
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-ignore
        const memory = performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        
        await this.recordMetric({
          metric_name: 'memory_usage',
          metric_type: 'memory',
          value: memory,
          unit: 'MB',
          screen_name: context?.screenName,
          memory_usage_mb: memory,
        });
      }
    } catch (error) {
      console.error('Failed to measure memory usage:', error);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export function startPerformanceTiming(metricName: string) {
  performanceMonitor.startTiming(metricName);
}

export async function endPerformanceTiming(
  metricName: string,
  metricType: string,
  context?: {
    screenName?: string;
    endpoint?: string;
    unit?: string;
    metadata?: Record<string, any>;
  }
) {
  await performanceMonitor.endTiming(metricName, metricType, context);
}

export async function measureApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>,
  context?: { screenName?: string }
): Promise<T> {
  return performanceMonitor.measureApiCall(endpoint, fn, context);
}

export async function measureScreenLoad(
  screenName: string,
  loadTime: number,
  context?: Record<string, any>
) {
  await performanceMonitor.measureScreenLoad(screenName, loadTime, context);
}

export async function measureMemoryUsage(context?: { screenName?: string }) {
  await performanceMonitor.measureMemoryUsage(context);
}
