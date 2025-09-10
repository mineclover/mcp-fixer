import { z } from 'zod';
// Execution status enumeration
export const ExecutionStatus = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
// Execution error details
export const ExecutionErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
    stack: z.string().optional(),
    timestamp: z.string().datetime(),
});
// Execution performance metrics
export const ExecutionMetricsSchema = z.object({
    startTime: z.number(),
    endTime: z.number().optional(),
    duration: z.number().optional(),
    memoryUsage: z.object({
        heapUsed: z.number(),
        heapTotal: z.number(),
        external: z.number(),
    }).optional(),
    cpuUsage: z.object({
        user: z.number(),
        system: z.number(),
    }).optional(),
});
// Execution context (runtime environment)
export const ExecutionContextSchema = z.object({
    queryId: z.string().uuid(),
    executionId: z.string().uuid(),
    parameters: z.record(z.string(), z.any()).optional(),
    collectorInputs: z.record(z.string(), z.any()).optional(),
    credentialRefs: z.array(z.string().uuid()).optional(),
    environment: z.record(z.string(), z.string()).optional(),
    timeout: z.number().int().positive().optional(),
    retryCount: z.number().int().min(0).default(0),
    maxRetries: z.number().int().min(0).default(0),
});
// Execution schema definition
export const ExecutionSchema = z.object({
    id: z.string().uuid(),
    queryId: z.string().uuid(),
    parameters: z.record(z.string(), z.any()).optional(),
    collectorInputs: z.record(z.string(), z.any()).optional(),
    credentialRefs: z.array(z.string().uuid()).optional(),
    status: ExecutionStatus.default('pending'),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    result: z.any().optional(),
    errorDetails: ExecutionErrorSchema.optional(),
    metrics: ExecutionMetricsSchema.optional(),
    context: z.record(z.string(), z.any()).optional(),
});
// Execution creation input
export const ExecutionCreateSchema = ExecutionSchema.omit({
    id: true,
    startedAt: true,
    completedAt: true,
    status: true,
    result: true,
    errorDetails: true,
    metrics: true,
});
// Execution update input
export const ExecutionUpdateSchema = z.object({
    status: ExecutionStatus.optional(),
    completedAt: z.string().datetime().optional(),
    result: z.any().optional(),
    errorDetails: ExecutionErrorSchema.optional(),
    metrics: ExecutionMetricsSchema.optional(),
}).partial();
// Execution history filters
export const ExecutionHistoryFiltersSchema = z.object({
    queryId: z.string().uuid().optional(),
    status: ExecutionStatus.optional(),
    startedAfter: z.string().datetime().optional(),
    startedBefore: z.string().datetime().optional(),
    completedAfter: z.string().datetime().optional(),
    completedBefore: z.string().datetime().optional(),
    durationMin: z.number().optional(),
    durationMax: z.number().optional(),
}).partial();
// Execution statistics
export const ExecutionStatsSchema = z.object({
    totalExecutions: z.number(),
    successfulExecutions: z.number(),
    failedExecutions: z.number(),
    cancelledExecutions: z.number(),
    averageDuration: z.number().optional(),
    successRate: z.number(),
    totalDuration: z.number(),
    executionsPerHour: z.number().optional(),
});
// Execution summary (for listing)
export const ExecutionSummarySchema = z.object({
    id: z.string().uuid(),
    queryId: z.string().uuid(),
    queryName: z.string().optional(),
    status: ExecutionStatus,
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    duration: z.number().optional(),
    success: z.boolean(),
    errorMessage: z.string().optional(),
});
// Execution retry configuration
export const RetryConfigSchema = z.object({
    maxRetries: z.number().int().min(0).default(0),
    retryDelay: z.number().int().positive().default(1000),
    exponentialBackoff: z.boolean().default(false),
    retryOnErrors: z.array(z.string()).optional(),
});
// Utility functions for execution model
export class ExecutionModel {
    /**
     * Validates an execution object against the schema
     */
    static validate(execution) {
        try {
            ExecutionSchema.parse(execution);
            return { valid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                };
            }
            return {
                valid: false,
                errors: [String(error)],
            };
        }
    }
    /**
     * Creates a new execution with generated fields
     */
    static create(executionData) {
        const now = new Date().toISOString();
        const startTime = Date.now();
        return {
            id: crypto.randomUUID(),
            startedAt: now,
            status: 'pending',
            metrics: {
                startTime,
            },
            ...executionData,
        };
    }
    /**
     * Updates an execution with new data
     */
    static update(existingExecution, updateData) {
        const updated = {
            ...existingExecution,
            ...updateData,
        };
        // Update metrics when status changes
        if (updateData.status && updateData.status !== existingExecution.status) {
            const now = Date.now();
            const metrics = existingExecution.metrics || { startTime: now };
            if (updateData.status === 'running' && !metrics.startTime) {
                metrics.startTime = now;
            }
            if (['completed', 'failed', 'cancelled'].includes(updateData.status)) {
                metrics.endTime = now;
                metrics.duration = metrics.endTime - metrics.startTime;
                updated.completedAt = new Date().toISOString();
            }
            updated.metrics = metrics;
        }
        return updated;
    }
    /**
     * Marks execution as started
     */
    static start(execution) {
        return this.update(execution, {
            status: 'running',
        });
    }
    /**
     * Marks execution as completed with result
     */
    static complete(execution, result) {
        return this.update(execution, {
            status: 'completed',
            result,
        });
    }
    /**
     * Marks execution as failed with error
     */
    static fail(execution, error) {
        const errorDetails = {
            code: error instanceof Error ? error.name : 'ERROR',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        };
        return this.update(execution, {
            status: 'failed',
            errorDetails,
        });
    }
    /**
     * Marks execution as cancelled
     */
    static cancel(execution, reason) {
        const errorDetails = {
            code: 'CANCELLED',
            message: reason || 'Execution was cancelled',
            timestamp: new Date().toISOString(),
        };
        return this.update(execution, {
            status: 'cancelled',
            errorDetails,
        });
    }
    /**
     * Checks if execution is in a final state
     */
    static isFinal(execution) {
        return ['completed', 'failed', 'cancelled'].includes(execution.status);
    }
    /**
     * Checks if execution was successful
     */
    static isSuccessful(execution) {
        return execution.status === 'completed';
    }
    /**
     * Checks if execution has timed out
     */
    static hasTimedOut(execution, timeoutMs) {
        if (this.isFinal(execution)) {
            return false;
        }
        const startTime = new Date(execution.startedAt).getTime();
        const now = Date.now();
        return (now - startTime) > timeoutMs;
    }
    /**
     * Calculates execution duration in milliseconds
     */
    static getDuration(execution) {
        if (!execution.metrics?.startTime) {
            return null;
        }
        const endTime = execution.metrics.endTime || Date.now();
        return endTime - execution.metrics.startTime;
    }
    /**
     * Creates execution context for runtime
     */
    static createContext(execution, options = {}) {
        return {
            queryId: execution.queryId,
            executionId: execution.id,
            parameters: execution.parameters,
            collectorInputs: execution.collectorInputs,
            credentialRefs: execution.credentialRefs,
            environment: options.environment,
            timeout: options.timeout,
            retryCount: 0,
            maxRetries: options.retryConfig?.maxRetries || 0,
        };
    }
    /**
     * Determines if execution should be retried
     */
    static shouldRetry(execution, context, retryConfig) {
        if (execution.status !== 'failed') {
            return false;
        }
        if (context.retryCount >= retryConfig.maxRetries) {
            return false;
        }
        // Check if error type is retryable
        if (retryConfig.retryOnErrors && execution.errorDetails) {
            const errorCode = execution.errorDetails.code;
            return retryConfig.retryOnErrors.includes(errorCode);
        }
        return true;
    }
    /**
     * Calculates retry delay based on configuration
     */
    static calculateRetryDelay(retryCount, retryConfig) {
        const baseDelay = retryConfig.retryDelay;
        if (retryConfig.exponentialBackoff) {
            return baseDelay * Math.pow(2, retryCount);
        }
        return baseDelay;
    }
    /**
     * Creates execution summary for listing
     */
    static toSummary(execution, queryName) {
        const duration = this.getDuration(execution);
        return {
            id: execution.id,
            queryId: execution.queryId,
            queryName,
            status: execution.status,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            duration,
            success: this.isSuccessful(execution),
            errorMessage: execution.errorDetails?.message,
        };
    }
    /**
     * Converts database row to Execution object
     */
    static fromDatabase(row) {
        return {
            id: row.id,
            queryId: row.query_id,
            parameters: row.parameters ? JSON.parse(row.parameters) : undefined,
            collectorInputs: row.collector_inputs ? JSON.parse(row.collector_inputs) : undefined,
            credentialRefs: row.credential_refs ? JSON.parse(row.credential_refs) : undefined,
            status: row.status,
            startedAt: row.started_at,
            completedAt: row.completed_at || undefined,
            result: row.result ? JSON.parse(row.result) : undefined,
            errorDetails: row.error_details ? JSON.parse(row.error_details) : undefined,
            metrics: row.metrics ? JSON.parse(row.metrics) : undefined,
            context: row.context ? JSON.parse(row.context) : undefined,
        };
    }
    /**
     * Converts Execution object to database row format
     */
    static toDatabase(execution) {
        return {
            id: execution.id,
            query_id: execution.queryId,
            parameters: execution.parameters ? JSON.stringify(execution.parameters) : null,
            collector_inputs: execution.collectorInputs ? JSON.stringify(execution.collectorInputs) : null,
            credential_refs: execution.credentialRefs ? JSON.stringify(execution.credentialRefs) : null,
            status: execution.status,
            started_at: execution.startedAt,
            completed_at: execution.completedAt || null,
            result: execution.result ? JSON.stringify(execution.result) : null,
            error_details: execution.errorDetails ? JSON.stringify(execution.errorDetails) : null,
            metrics: execution.metrics ? JSON.stringify(execution.metrics) : null,
            context: execution.context ? JSON.stringify(execution.context) : null,
        };
    }
    /**
     * Validates execution parameters against query schema
     */
    static validateParameters(execution, queryParameterSchema) {
        if (!execution.parameters && !queryParameterSchema.required) {
            return { valid: true, errors: [] };
        }
        try {
            // Use the same JSON Schema validation approach as Query model
            const errors = [];
            if (queryParameterSchema.required) {
                for (const requiredParam of queryParameterSchema.required) {
                    if (!execution.parameters || !(requiredParam in execution.parameters)) {
                        errors.push(`Required parameter missing: ${requiredParam}`);
                    }
                }
            }
            if (queryParameterSchema.properties && execution.parameters) {
                for (const [paramName, paramValue] of Object.entries(execution.parameters)) {
                    const paramSchema = queryParameterSchema.properties[paramName];
                    if (paramSchema) {
                        // Basic type validation
                        const expectedType = paramSchema.type;
                        const actualType = typeof paramValue;
                        if (expectedType === 'number' && actualType !== 'number') {
                            errors.push(`Parameter ${paramName}: expected number, got ${actualType}`);
                        }
                        else if (expectedType === 'string' && actualType !== 'string') {
                            errors.push(`Parameter ${paramName}: expected string, got ${actualType}`);
                        }
                        else if (expectedType === 'boolean' && actualType !== 'boolean') {
                            errors.push(`Parameter ${paramName}: expected boolean, got ${actualType}`);
                        }
                    }
                }
            }
            return { valid: errors.length === 0, errors };
        }
        catch (error) {
            return {
                valid: false,
                errors: [`Parameter validation failed: ${String(error)}`],
            };
        }
    }
    /**
     * Groups executions by status for statistics
     */
    static groupByStatus(executions) {
        const groups = {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
        };
        for (const execution of executions) {
            groups[execution.status]++;
        }
        return groups;
    }
    /**
     * Calculates statistics from execution list
     */
    static calculateStats(executions) {
        const groups = this.groupByStatus(executions);
        const totalExecutions = executions.length;
        const successfulExecutions = groups.completed;
        const failedExecutions = groups.failed;
        const cancelledExecutions = groups.cancelled;
        const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
        // Calculate durations
        const durations = executions
            .map(e => this.getDuration(e))
            .filter((d) => d !== null);
        const totalDuration = durations.reduce((sum, d) => sum + d, 0);
        const averageDuration = durations.length > 0 ? totalDuration / durations.length : undefined;
        // Calculate executions per hour (based on completed executions)
        const completedExecutions = executions.filter(e => e.completedAt);
        let executionsPerHour;
        if (completedExecutions.length > 1) {
            const timestamps = completedExecutions.map(e => new Date(e.completedAt).getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const hoursDiff = (maxTime - minTime) / (1000 * 60 * 60);
            if (hoursDiff > 0) {
                executionsPerHour = completedExecutions.length / hoursDiff;
            }
        }
        return {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            cancelledExecutions,
            averageDuration,
            successRate,
            totalDuration,
            executionsPerHour,
        };
    }
}
