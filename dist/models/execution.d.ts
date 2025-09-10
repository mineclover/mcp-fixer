import { z } from 'zod';
export declare const ExecutionStatus: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
export type ExecutionStatusType = z.infer<typeof ExecutionStatus>;
export declare const ExecutionErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    stack: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}, {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}>;
export type ExecutionError = z.infer<typeof ExecutionErrorSchema>;
export declare const ExecutionMetricsSchema: z.ZodObject<{
    startTime: z.ZodNumber;
    endTime: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodNumber>;
    memoryUsage: z.ZodOptional<z.ZodObject<{
        heapUsed: z.ZodNumber;
        heapTotal: z.ZodNumber;
        external: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        heapUsed: number;
        heapTotal: number;
        external: number;
    }, {
        heapUsed: number;
        heapTotal: number;
        external: number;
    }>>;
    cpuUsage: z.ZodOptional<z.ZodObject<{
        user: z.ZodNumber;
        system: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        user: number;
        system: number;
    }, {
        user: number;
        system: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    startTime: number;
    duration?: number | undefined;
    endTime?: number | undefined;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    } | undefined;
    cpuUsage?: {
        user: number;
        system: number;
    } | undefined;
}, {
    startTime: number;
    duration?: number | undefined;
    endTime?: number | undefined;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    } | undefined;
    cpuUsage?: {
        user: number;
        system: number;
    } | undefined;
}>;
export type ExecutionMetrics = z.infer<typeof ExecutionMetricsSchema>;
export declare const ExecutionContextSchema: z.ZodObject<{
    queryId: z.ZodString;
    executionId: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    collectorInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    credentialRefs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    executionId: string;
    queryId: string;
    retryCount: number;
    maxRetries: number;
    timeout?: number | undefined;
    parameters?: Record<string, any> | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    environment?: Record<string, string> | undefined;
}, {
    executionId: string;
    queryId: string;
    timeout?: number | undefined;
    parameters?: Record<string, any> | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    environment?: Record<string, string> | undefined;
    retryCount?: number | undefined;
    maxRetries?: number | undefined;
}>;
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;
export declare const ExecutionSchema: z.ZodObject<{
    id: z.ZodString;
    queryId: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    collectorInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    credentialRefs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodAny>;
    errorDetails: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
    metrics: z.ZodOptional<z.ZodObject<{
        startTime: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        memoryUsage: z.ZodOptional<z.ZodObject<{
            heapUsed: z.ZodNumber;
            heapTotal: z.ZodNumber;
            external: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }>>;
        cpuUsage: z.ZodOptional<z.ZodObject<{
            user: z.ZodNumber;
            system: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            user: number;
            system: number;
        }, {
            user: number;
            system: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    id: string;
    queryId: string;
    startedAt: string;
    parameters?: Record<string, any> | undefined;
    result?: any;
    completedAt?: string | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    errorDetails?: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    metrics?: {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    } | undefined;
    context?: Record<string, any> | undefined;
}, {
    id: string;
    queryId: string;
    startedAt: string;
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    parameters?: Record<string, any> | undefined;
    result?: any;
    completedAt?: string | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    errorDetails?: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    metrics?: {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    } | undefined;
    context?: Record<string, any> | undefined;
}>;
export type Execution = z.infer<typeof ExecutionSchema>;
export declare const ExecutionCreateSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    queryId: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    collectorInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    credentialRefs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodAny>;
    errorDetails: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
    metrics: z.ZodOptional<z.ZodObject<{
        startTime: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        memoryUsage: z.ZodOptional<z.ZodObject<{
            heapUsed: z.ZodNumber;
            heapTotal: z.ZodNumber;
            external: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }>>;
        cpuUsage: z.ZodOptional<z.ZodObject<{
            user: z.ZodNumber;
            system: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            user: number;
            system: number;
        }, {
            user: number;
            system: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "status" | "id" | "result" | "startedAt" | "completedAt" | "errorDetails" | "metrics">, "strip", z.ZodTypeAny, {
    queryId: string;
    parameters?: Record<string, any> | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    context?: Record<string, any> | undefined;
}, {
    queryId: string;
    parameters?: Record<string, any> | undefined;
    collectorInputs?: Record<string, any> | undefined;
    credentialRefs?: string[] | undefined;
    context?: Record<string, any> | undefined;
}>;
export type ExecutionCreate = z.infer<typeof ExecutionCreateSchema>;
export declare const ExecutionUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>>>;
    completedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    result: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    errorDetails: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>>;
    metrics: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        startTime: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        memoryUsage: z.ZodOptional<z.ZodObject<{
            heapUsed: z.ZodNumber;
            heapTotal: z.ZodNumber;
            external: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }, {
            heapUsed: number;
            heapTotal: number;
            external: number;
        }>>;
        cpuUsage: z.ZodOptional<z.ZodObject<{
            user: z.ZodNumber;
            system: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            user: number;
            system: number;
        }, {
            user: number;
            system: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }, {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    result?: any;
    completedAt?: string | undefined;
    errorDetails?: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    metrics?: {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    } | undefined;
}, {
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    result?: any;
    completedAt?: string | undefined;
    errorDetails?: {
        code: string;
        message: string;
        timestamp: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    metrics?: {
        startTime: number;
        duration?: number | undefined;
        endTime?: number | undefined;
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        } | undefined;
        cpuUsage?: {
            user: number;
            system: number;
        } | undefined;
    } | undefined;
}>;
export type ExecutionUpdate = z.infer<typeof ExecutionUpdateSchema>;
export declare const ExecutionHistoryFiltersSchema: z.ZodObject<{
    queryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>>>;
    startedAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    startedBefore: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    completedAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    completedBefore: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    durationMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    durationMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    queryId?: string | undefined;
    startedAfter?: string | undefined;
    startedBefore?: string | undefined;
    completedAfter?: string | undefined;
    completedBefore?: string | undefined;
    durationMin?: number | undefined;
    durationMax?: number | undefined;
}, {
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    queryId?: string | undefined;
    startedAfter?: string | undefined;
    startedBefore?: string | undefined;
    completedAfter?: string | undefined;
    completedBefore?: string | undefined;
    durationMin?: number | undefined;
    durationMax?: number | undefined;
}>;
export type ExecutionHistoryFilters = z.infer<typeof ExecutionHistoryFiltersSchema>;
export declare const ExecutionStatsSchema: z.ZodObject<{
    totalExecutions: z.ZodNumber;
    successfulExecutions: z.ZodNumber;
    failedExecutions: z.ZodNumber;
    cancelledExecutions: z.ZodNumber;
    averageDuration: z.ZodOptional<z.ZodNumber>;
    successRate: z.ZodNumber;
    totalDuration: z.ZodNumber;
    executionsPerHour: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    cancelledExecutions: number;
    successRate: number;
    totalDuration: number;
    averageDuration?: number | undefined;
    executionsPerHour?: number | undefined;
}, {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    cancelledExecutions: number;
    successRate: number;
    totalDuration: number;
    averageDuration?: number | undefined;
    executionsPerHour?: number | undefined;
}>;
export type ExecutionStats = z.infer<typeof ExecutionStatsSchema>;
export declare const ExecutionSummarySchema: z.ZodObject<{
    id: z.ZodString;
    queryId: z.ZodString;
    queryName: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    success: z.ZodBoolean;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    id: string;
    success: boolean;
    queryId: string;
    startedAt: string;
    duration?: number | undefined;
    completedAt?: string | undefined;
    queryName?: string | undefined;
    errorMessage?: string | undefined;
}, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    id: string;
    success: boolean;
    queryId: string;
    startedAt: string;
    duration?: number | undefined;
    completedAt?: string | undefined;
    queryName?: string | undefined;
    errorMessage?: string | undefined;
}>;
export type ExecutionSummary = z.infer<typeof ExecutionSummarySchema>;
export declare const RetryConfigSchema: z.ZodObject<{
    maxRetries: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    exponentialBackoff: z.ZodDefault<z.ZodBoolean>;
    retryOnErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    retryDelay: number;
    maxRetries: number;
    exponentialBackoff: boolean;
    retryOnErrors?: string[] | undefined;
}, {
    retryDelay?: number | undefined;
    maxRetries?: number | undefined;
    exponentialBackoff?: boolean | undefined;
    retryOnErrors?: string[] | undefined;
}>;
export type RetryConfig = z.infer<typeof RetryConfigSchema>;
export declare class ExecutionModel {
    /**
     * Validates an execution object against the schema
     */
    static validate(execution: unknown): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Creates a new execution with generated fields
     */
    static create(executionData: ExecutionCreate): Execution;
    /**
     * Updates an execution with new data
     */
    static update(existingExecution: Execution, updateData: ExecutionUpdate): Execution;
    /**
     * Marks execution as started
     */
    static start(execution: Execution): Execution;
    /**
     * Marks execution as completed with result
     */
    static complete(execution: Execution, result: any): Execution;
    /**
     * Marks execution as failed with error
     */
    static fail(execution: Execution, error: Error | string): Execution;
    /**
     * Marks execution as cancelled
     */
    static cancel(execution: Execution, reason?: string): Execution;
    /**
     * Checks if execution is in a final state
     */
    static isFinal(execution: Execution): boolean;
    /**
     * Checks if execution was successful
     */
    static isSuccessful(execution: Execution): boolean;
    /**
     * Checks if execution has timed out
     */
    static hasTimedOut(execution: Execution, timeoutMs: number): boolean;
    /**
     * Calculates execution duration in milliseconds
     */
    static getDuration(execution: Execution): number | null;
    /**
     * Creates execution context for runtime
     */
    static createContext(execution: Execution, options?: {
        timeout?: number;
        environment?: Record<string, string>;
        retryConfig?: RetryConfig;
    }): ExecutionContext;
    /**
     * Determines if execution should be retried
     */
    static shouldRetry(execution: Execution, context: ExecutionContext, retryConfig: RetryConfig): boolean;
    /**
     * Calculates retry delay based on configuration
     */
    static calculateRetryDelay(retryCount: number, retryConfig: RetryConfig): number;
    /**
     * Creates execution summary for listing
     */
    static toSummary(execution: Execution, queryName?: string): ExecutionSummary;
    /**
     * Converts database row to Execution object
     */
    static fromDatabase(row: any): Execution;
    /**
     * Converts Execution object to database row format
     */
    static toDatabase(execution: Execution): Record<string, any>;
    /**
     * Validates execution parameters against query schema
     */
    static validateParameters(execution: Execution, queryParameterSchema: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Groups executions by status for statistics
     */
    static groupByStatus(executions: Execution[]): Record<ExecutionStatusType, number>;
    /**
     * Calculates statistics from execution list
     */
    static calculateStats(executions: Execution[]): ExecutionStats;
}
//# sourceMappingURL=execution.d.ts.map