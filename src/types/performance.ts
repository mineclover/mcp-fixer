import { z } from 'zod';

export const PerformanceMetricSchema = z.object({
  id: z.string(),
  interfaceId: z.string().optional(),
  toolId: z.string(),
  accessType: z.enum(['fixed', 'dynamic']),
  operationName: z.string().min(1),
  responseTimeMs: z.number().positive(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  errorCategory: z.enum(['auth', 'network', 'validation', 'server', 'timeout', 'unknown']).optional(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;

export interface PerformanceMetricCreateInput {
  interfaceId?: string;
  toolId: string;
  accessType: 'fixed' | 'dynamic';
  operationName: string;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
  errorCategory?: 'auth' | 'network' | 'validation' | 'server' | 'timeout' | 'unknown';
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  toolId: string;
  toolName: string;
  operationName?: string;
  accessType: 'fixed' | 'dynamic';
  metrics: {
    callCount: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceComparison {
  toolId: string;
  toolName: string;
  operationName: string;
  fixed: {
    avgResponseTime: number;
    successRate: number;
    callCount: number;
  };
  dynamic: {
    avgResponseTime: number;
    successRate: number;
    callCount: number;
  };
  improvement: {
    responseTimePercent: number;
    successRatePercent: number;
  };
}

export interface PerformanceAnalysis {
  summary: {
    totalCalls: number;
    avgResponseTime: number;
    successRate: number;
    errorCategories: Record<string, number>;
  };
  trends: {
    hourly: PerformanceTrend[];
    daily: PerformanceTrend[];
  };
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
}

export interface PerformanceTrend {
  period: string;
  avgResponseTime: number;
  callCount: number;
  successRate: number;
}

export interface PerformanceBottleneck {
  operationName: string;
  avgResponseTime: number;
  impactScore: number;
  suggestion: string;
}