import { z } from 'zod';
import { Query, QueryCreate, QueryUpdate } from '../../models/query.js';
import { Execution } from '../../models/execution.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';
declare const QueryExecutionOptionsSchema: z.ZodObject<{
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    validateOutput: z.ZodDefault<z.ZodBoolean>;
    saveExecution: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    validateOutput: boolean;
    saveExecution: boolean;
}, {
    retryAttempts?: number | undefined;
    retryDelay?: number | undefined;
    timeout?: number | undefined;
    validateOutput?: boolean | undefined;
    saveExecution?: boolean | undefined;
}>;
export type QueryExecutionOptions = z.infer<typeof QueryExecutionOptionsSchema>;
declare const QuerySearchFiltersSchema: z.ZodObject<{
    toolId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    search: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["active", "inactive"]>>>;
    createdAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    createdBefore: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastExecutedAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    hasBeenExecuted: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | undefined;
    search?: string | undefined;
    toolId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastExecutedAfter?: string | undefined;
    hasBeenExecuted?: boolean | undefined;
}, {
    status?: "active" | "inactive" | undefined;
    search?: string | undefined;
    toolId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastExecutedAfter?: string | undefined;
    hasBeenExecuted?: boolean | undefined;
}>;
export type QuerySearchFilters = z.infer<typeof QuerySearchFiltersSchema>;
declare const QueryExecutionResultSchema: z.ZodObject<{
    executionId: z.ZodString;
    queryId: z.ZodString;
    status: z.ZodEnum<["completed", "failed", "timeout", "cancelled"]>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    executionTime: z.ZodOptional<z.ZodNumber>;
    parameterValidation: z.ZodOptional<z.ZodObject<{
        valid: z.ZodBoolean;
        errors: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        errors: string[];
    }, {
        valid: boolean;
        errors: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "timeout" | "completed" | "failed" | "cancelled";
    executionId: string;
    queryId: string;
    startedAt: string;
    error?: string | undefined;
    result?: any;
    completedAt?: string | undefined;
    executionTime?: number | undefined;
    parameterValidation?: {
        valid: boolean;
        errors: string[];
    } | undefined;
}, {
    status: "timeout" | "completed" | "failed" | "cancelled";
    executionId: string;
    queryId: string;
    startedAt: string;
    error?: string | undefined;
    result?: any;
    completedAt?: string | undefined;
    executionTime?: number | undefined;
    parameterValidation?: {
        valid: boolean;
        errors: string[];
    } | undefined;
}>;
export type QueryExecutionResult = z.infer<typeof QueryExecutionResultSchema>;
export declare class QueryEngine {
    private db;
    private config;
    private activeExecutions;
    constructor(db: DatabaseManager, config: ConfigManager);
    /**
     * Create a new query
     */
    createQuery(queryData: QueryCreate): Promise<Query>;
    /**
     * Get query by ID or name
     */
    getQuery(identifier: string): Promise<Query | null>;
    /**
     * List queries with optional filters
     */
    listQueries(filters?: QuerySearchFilters, limit?: number, offset?: number): Promise<{
        queries: Query[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Update an existing query
     */
    updateQuery(queryId: string, updates: QueryUpdate): Promise<Query>;
    /**
     * Delete a query and its executions
     */
    deleteQuery(queryId: string): Promise<boolean>;
    /**
     * Execute a query with parameters
     */
    executeQuery(queryId: string, parameters?: Record<string, any>, collectorInputs?: Record<string, any>, options?: Partial<QueryExecutionOptions>): Promise<QueryExecutionResult>;
    /**
     * Cancel a running query execution
     */
    cancelExecution(executionId: string): Promise<boolean>;
    /**
     * Get execution history for a query
     */
    getExecutionHistory(queryId: string, limit?: number, offset?: number): Promise<{
        executions: Execution[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get query statistics
     */
    getQueryStats(queryId?: string): Promise<{
        totalQueries: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        topQueries: Array<{
            id: string;
            name: string;
            executionCount: number;
            lastExecuted?: string;
        }>;
    }>;
    private validateQueryParameters;
    private performQueryExecution;
    private createExecutionRecord;
    private updateExecutionRecord;
    private updateQueryStatistics;
}
export {};
//# sourceMappingURL=query-engine.d.ts.map