import { z } from 'zod';

// Access type enumeration
export const AccessTypeSchema = z.enum(['fixed', 'dynamic']);
export type AccessType = z.infer<typeof AccessTypeSchema>;

// Error categories for performance tracking
export const ErrorCategorySchema = z.enum(['auth', 'network', 'validation', 'server', 'timeout', 'unknown']);
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

// Performance metric core schema
export const PerformanceMetricSchema = z.object({
  id: z.string().uuid(),
  interfaceId: z.string().uuid().optional(), // NULL for dynamic access metrics
  toolId: z.string().uuid(),
  accessType: AccessTypeSchema,
  operationName: z.string().min(1).max(255),
  responseTimeMs: z.number().positive(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  errorCategory: ErrorCategorySchema.optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;

// Performance metric creation input
export const PerformanceMetricCreateSchema = PerformanceMetricSchema.omit({
  id: true,
  timestamp: true,
}).extend({
  timestamp: z.string().datetime().optional(),
});
export type PerformanceMetricCreate = z.infer<typeof PerformanceMetricCreateSchema>;

// Performance metric update input
export const PerformanceMetricUpdateSchema = PerformanceMetricSchema.partial().omit({
  id: true,
  toolId: true,
  timestamp: true,
});
export type PerformanceMetricUpdate = z.infer<typeof PerformanceMetricUpdateSchema>;

// Performance comparison result
export const PerformanceComparisonSchema = z.object({
  toolId: z.string().uuid(),
  toolName: z.string(),
  operationName: z.string(),
  fixedAccess: z.object({
    averageResponseTime: z.number(),
    minResponseTime: z.number(),
    maxResponseTime: z.number(),
    successRate: z.number().min(0).max(1),
    totalCalls: z.number(),
  }).optional(),
  dynamicAccess: z.object({
    averageResponseTime: z.number(),
    minResponseTime: z.number(),
    maxResponseTime: z.number(),
    successRate: z.number().min(0).max(1),
    totalCalls: z.number(),
  }).optional(),
  improvementPercentage: z.number().optional(), // Positive = fixed is faster
  significanceScore: z.number().min(0).max(1).optional(), // Statistical significance
});
export type PerformanceComparison = z.infer<typeof PerformanceComparisonSchema>;

// Performance analytics result
export const PerformanceAnalyticsSchema = z.object({
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  totalMetrics: z.number(),
  averageResponseTime: z.number(),
  medianResponseTime: z.number(),
  p95ResponseTime: z.number(), // 95th percentile
  p99ResponseTime: z.number(), // 99th percentile
  successRate: z.number().min(0).max(1),
  errorBreakdown: z.record(ErrorCategorySchema, z.number()),
  trendData: z.array(z.object({
    timestamp: z.string().datetime(),
    averageResponseTime: z.number(),
    successRate: z.number(),
    totalCalls: z.number(),
  })),
});
export type PerformanceAnalytics = z.infer<typeof PerformanceAnalyticsSchema>;

// Performance threshold configuration
export const PerformanceThresholdSchema = z.object({
  targetResponseTimeMs: z.number().positive().default(100), // Target: <100ms for fixed interfaces
  warningThresholdMs: z.number().positive().default(200),
  errorThresholdMs: z.number().positive().default(500),
  minimumSuccessRate: z.number().min(0).max(1).default(0.95), // 95% success rate
  minimumImprovementPercent: z.number().default(50), // 50% improvement over dynamic
});
export type PerformanceThreshold = z.infer<typeof PerformanceThresholdSchema>;

// Performance alert
export const PerformanceAlertSchema = z.object({
  id: z.string().uuid(),
  metricId: z.string().uuid(),
  alertType: z.enum(['response_time', 'error_rate', 'availability', 'degradation']),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string(),
  threshold: z.number(),
  actualValue: z.number(),
  timestamp: z.string().datetime(),
  acknowledged: z.boolean().default(false),
});
export type PerformanceAlert = z.infer<typeof PerformanceAlertSchema>;

// Performance metric list filters
export const PerformanceMetricListFiltersSchema = z.object({
  toolId: z.string().uuid().optional(),
  interfaceId: z.string().uuid().optional(),
  accessType: AccessTypeSchema.optional(),
  operationName: z.string().optional(),
  success: z.boolean().optional(),
  errorCategory: ErrorCategorySchema.optional(),
  minResponseTime: z.number().optional(),
  maxResponseTime: z.number().optional(),
  timeRangeStart: z.string().datetime().optional(),
  timeRangeEnd: z.string().datetime().optional(),
}).partial();
export type PerformanceMetricListFilters = z.infer<typeof PerformanceMetricListFiltersSchema>;

// Performance statistics
export const PerformanceStatsSchema = z.object({
  totalMetrics: z.number(),
  fixedInterfaceMetrics: z.number(),
  dynamicAccessMetrics: z.number(),
  averageResponseTime: z.number(),
  overallSuccessRate: z.number().min(0).max(1),
  improvementOverDynamic: z.number().optional(), // Percentage
  thresholdCompliance: z.number().min(0).max(1), // Metrics meeting threshold
});
export type PerformanceStats = z.infer<typeof PerformanceStatsSchema>;

// Benchmark configuration
export const BenchmarkConfigSchema = z.object({
  toolId: z.string().uuid(),
  operationName: z.string(),
  iterations: z.number().min(1).max(1000).default(100),
  concurrency: z.number().min(1).max(10).default(1),
  timeout: z.number().min(1000).max(60000).default(30000), // milliseconds
  compareAccessTypes: z.boolean().default(true),
});
export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;

// Benchmark result
export const BenchmarkResultSchema = z.object({
  config: BenchmarkConfigSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  totalDuration: z.number(), // milliseconds
  results: z.array(PerformanceMetricSchema),
  summary: PerformanceAnalyticsSchema,
  comparison: PerformanceComparisonSchema.optional(),
});
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

// Utility functions and analytics logic
export class PerformanceMetricModel {
  private static readonly DEFAULT_THRESHOLDS: PerformanceThreshold = {
    targetResponseTimeMs: 100,
    warningThresholdMs: 200,
    errorThresholdMs: 500,
    minimumSuccessRate: 0.95,
    minimumImprovementPercent: 50,
  };

  /**
   * Validates a performance metric against the schema
   */
  static validate(metric: unknown): { valid: boolean; errors: string[]; warnings: string[] } {
    try {
      PerformanceMetricSchema.parse(metric);
      
      const perfMetric = metric as PerformanceMetric;
      const warnings: string[] = [];
      
      // Check against performance thresholds
      if (perfMetric.responseTimeMs > this.DEFAULT_THRESHOLDS.warningThresholdMs) {
        warnings.push(`Response time ${perfMetric.responseTimeMs}ms exceeds warning threshold`);
      }
      
      return { valid: true, errors: [], warnings };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Creates a new performance metric
   */
  static create(metricData: PerformanceMetricCreate): PerformanceMetric {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      timestamp: metricData.timestamp || now,
      ...metricData,
    };
  }

  /**
   * Records a performance metric for an operation
   */
  static recordOperation(
    toolId: string,
    operationName: string,
    accessType: AccessType,
    responseTimeMs: number,
    success: boolean,
    interfaceId?: string,
    error?: { message: string; category: ErrorCategory },
    metadata?: Record<string, any>
  ): PerformanceMetric {
    return this.create({
      toolId,
      operationName,
      accessType,
      responseTimeMs,
      success,
      interfaceId,
      errorMessage: error?.message,
      errorCategory: error?.category,
      metadata: metadata || {},
    });
  }

  /**
   * Calculates performance analytics from metrics
   */
  static calculateAnalytics(
    metrics: PerformanceMetric[],
    startTime: string,
    endTime: string
  ): PerformanceAnalytics {
    if (metrics.length === 0) {
      return {
        period: { start: startTime, end: endTime },
        totalMetrics: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        errorBreakdown: {},
        trendData: [],
      };
    }

    const responseTimes = metrics.map(m => m.responseTimeMs).sort((a, b) => a - b);
    const successCount = metrics.filter(m => m.success).length;

    // Calculate percentiles
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p99Index = Math.ceil(responseTimes.length * 0.99) - 1;
    const medianIndex = Math.ceil(responseTimes.length * 0.5) - 1;

    // Error breakdown
    const errorBreakdown: Record<ErrorCategory, number> = {
      auth: 0,
      network: 0,
      validation: 0,
      server: 0,
      timeout: 0,
      unknown: 0,
    };

    metrics
      .filter(m => !m.success && m.errorCategory)
      .forEach(m => {
        errorBreakdown[m.errorCategory as ErrorCategory]++;
      });

    // Generate trend data (hourly buckets)
    const trendData = this.generateTrendData(metrics, startTime, endTime);

    return {
      period: { start: startTime, end: endTime },
      totalMetrics: metrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: responseTimes[medianIndex] || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      successRate: successCount / metrics.length,
      errorBreakdown,
      trendData,
    };
  }

  /**
   * Compares fixed vs dynamic access performance
   */
  static compareAccessTypes(
    toolId: string,
    toolName: string,
    operationName: string,
    metrics: PerformanceMetric[]
  ): PerformanceComparison {
    const fixedMetrics = metrics.filter(m => m.accessType === 'fixed');
    const dynamicMetrics = metrics.filter(m => m.accessType === 'dynamic');

    const fixedAccess = fixedMetrics.length > 0 ? {
      averageResponseTime: fixedMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / fixedMetrics.length,
      minResponseTime: Math.min(...fixedMetrics.map(m => m.responseTimeMs)),
      maxResponseTime: Math.max(...fixedMetrics.map(m => m.responseTimeMs)),
      successRate: fixedMetrics.filter(m => m.success).length / fixedMetrics.length,
      totalCalls: fixedMetrics.length,
    } : undefined;

    const dynamicAccess = dynamicMetrics.length > 0 ? {
      averageResponseTime: dynamicMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / dynamicMetrics.length,
      minResponseTime: Math.min(...dynamicMetrics.map(m => m.responseTimeMs)),
      maxResponseTime: Math.max(...dynamicMetrics.map(m => m.responseTimeMs)),
      successRate: dynamicMetrics.filter(m => m.success).length / dynamicMetrics.length,
      totalCalls: dynamicMetrics.length,
    } : undefined;

    let improvementPercentage: number | undefined;
    let significanceScore: number | undefined;

    if (fixedAccess && dynamicAccess) {
      improvementPercentage = ((dynamicAccess.averageResponseTime - fixedAccess.averageResponseTime) / dynamicAccess.averageResponseTime) * 100;
      
      // Simple significance calculation based on sample size and difference
      const sampleSizeScore = Math.min(1, (fixedMetrics.length + dynamicMetrics.length) / 100);
      const differenceScore = Math.min(1, Math.abs(improvementPercentage) / 50);
      significanceScore = sampleSizeScore * differenceScore;
    }

    return {
      toolId,
      toolName,
      operationName,
      fixedAccess,
      dynamicAccess,
      improvementPercentage,
      significanceScore,
    };
  }

  /**
   * Generates performance alerts based on thresholds
   */
  static generateAlerts(
    metrics: PerformanceMetric[],
    thresholds: PerformanceThreshold = this.DEFAULT_THRESHOLDS
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    metrics.forEach(metric => {
      // Response time alerts
      if (metric.responseTimeMs > thresholds.errorThresholdMs) {
        alerts.push({
          id: crypto.randomUUID(),
          metricId: metric.id,
          alertType: 'response_time',
          severity: 'error',
          message: `Response time ${metric.responseTimeMs}ms exceeds error threshold`,
          threshold: thresholds.errorThresholdMs,
          actualValue: metric.responseTimeMs,
          timestamp: metric.timestamp,
          acknowledged: false,
        });
      } else if (metric.responseTimeMs > thresholds.warningThresholdMs) {
        alerts.push({
          id: crypto.randomUUID(),
          metricId: metric.id,
          alertType: 'response_time',
          severity: 'warning',
          message: `Response time ${metric.responseTimeMs}ms exceeds warning threshold`,
          threshold: thresholds.warningThresholdMs,
          actualValue: metric.responseTimeMs,
          timestamp: metric.timestamp,
          acknowledged: false,
        });
      }

      // Error rate alerts
      if (!metric.success) {
        alerts.push({
          id: crypto.randomUUID(),
          metricId: metric.id,
          alertType: 'error_rate',
          severity: metric.errorCategory === 'auth' ? 'critical' : 'error',
          message: `Operation failed: ${metric.errorMessage || 'Unknown error'}`,
          threshold: thresholds.minimumSuccessRate,
          actualValue: 0, // Failed operation
          timestamp: metric.timestamp,
          acknowledged: false,
        });
      }
    });

    return alerts;
  }

  /**
   * Validates performance meets target thresholds
   */
  static validatePerformanceTarget(
    metrics: PerformanceMetric[],
    thresholds: PerformanceThreshold = this.DEFAULT_THRESHOLDS
  ): {
    meetsTarget: boolean;
    responseTimeCompliance: number; // 0-1
    successRateCompliance: number; // 0-1
    issues: string[];
  } {
    if (metrics.length === 0) {
      return {
        meetsTarget: false,
        responseTimeCompliance: 0,
        successRateCompliance: 0,
        issues: ['No metrics available for validation'],
      };
    }

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / metrics.length;
    const successRate = metrics.filter(m => m.success).length / metrics.length;
    const responseTimeCompliance = Math.max(0, 1 - (avgResponseTime / thresholds.targetResponseTimeMs));
    const successRateCompliance = successRate;

    const issues: string[] = [];
    
    if (avgResponseTime > thresholds.targetResponseTimeMs) {
      issues.push(`Average response time ${avgResponseTime.toFixed(1)}ms exceeds target ${thresholds.targetResponseTimeMs}ms`);
    }
    
    if (successRate < thresholds.minimumSuccessRate) {
      issues.push(`Success rate ${(successRate * 100).toFixed(1)}% below minimum ${(thresholds.minimumSuccessRate * 100)}%`);
    }

    return {
      meetsTarget: responseTimeCompliance > 0.8 && successRateCompliance >= thresholds.minimumSuccessRate,
      responseTimeCompliance,
      successRateCompliance,
      issues,
    };
  }

  /**
   * Converts database row to PerformanceMetric object
   */
  static fromDatabase(row: any): PerformanceMetric {
    return {
      id: row.id,
      interfaceId: row.interface_id || undefined,
      toolId: row.tool_id,
      accessType: row.access_type as AccessType,
      operationName: row.operation_name,
      responseTimeMs: row.response_time_ms,
      success: Boolean(row.success),
      errorMessage: row.error_message || undefined,
      errorCategory: row.error_category as ErrorCategory || undefined,
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }

  /**
   * Converts PerformanceMetric object to database row format
   */
  static toDatabase(metric: PerformanceMetric): Record<string, any> {
    return {
      id: metric.id,
      interface_id: metric.interfaceId || null,
      tool_id: metric.toolId,
      access_type: metric.accessType,
      operation_name: metric.operationName,
      response_time_ms: metric.responseTimeMs,
      success: metric.success,
      error_message: metric.errorMessage || null,
      error_category: metric.errorCategory || null,
      timestamp: metric.timestamp,
      metadata: JSON.stringify(metric.metadata),
    };
  }

  /**
   * Generates trend data from metrics (hourly buckets)
   */
  private static generateTrendData(
    metrics: PerformanceMetric[],
    startTime: string,
    endTime: string
  ): Array<{
    timestamp: string;
    averageResponseTime: number;
    successRate: number;
    totalCalls: number;
  }> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hourlyBuckets = new Map<string, PerformanceMetric[]>();

    // Group metrics by hour
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp);
      hour.setMinutes(0, 0, 0); // Round to hour
      const hourKey = hour.toISOString();
      
      if (!hourlyBuckets.has(hourKey)) {
        hourlyBuckets.set(hourKey, []);
      }
      hourlyBuckets.get(hourKey)!.push(metric);
    });

    // Generate trend data
    const trendData: Array<{
      timestamp: string;
      averageResponseTime: number;
      successRate: number;
      totalCalls: number;
    }> = [];

    for (let hour = new Date(start); hour <= end; hour.setHours(hour.getHours() + 1)) {
      const hourKey = hour.toISOString();
      const hourMetrics = hourlyBuckets.get(hourKey) || [];
      
      if (hourMetrics.length > 0) {
        trendData.push({
          timestamp: hourKey,
          averageResponseTime: hourMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / hourMetrics.length,
          successRate: hourMetrics.filter(m => m.success).length / hourMetrics.length,
          totalCalls: hourMetrics.length,
        });
      }
    }

    return trendData;
  }

  /**
   * Calculates statistical significance of performance improvement
   */
  static calculateStatisticalSignificance(
    fixedMetrics: PerformanceMetric[],
    dynamicMetrics: PerformanceMetric[]
  ): number {
    if (fixedMetrics.length < 10 || dynamicMetrics.length < 10) {
      return 0; // Insufficient data
    }

    const fixedTimes = fixedMetrics.map(m => m.responseTimeMs);
    const dynamicTimes = dynamicMetrics.map(m => m.responseTimeMs);
    
    // Simple t-test approximation
    const fixedMean = fixedTimes.reduce((a, b) => a + b) / fixedTimes.length;
    const dynamicMean = dynamicTimes.reduce((a, b) => a + b) / dynamicTimes.length;
    
    const effectSize = Math.abs(dynamicMean - fixedMean) / dynamicMean;
    const sampleSizeScore = Math.min(1, (fixedMetrics.length + dynamicMetrics.length) / 100);
    
    return Math.min(1, effectSize * sampleSizeScore);
  }
}