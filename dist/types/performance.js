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
