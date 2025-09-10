import { z } from 'zod';
export declare const QueryOperationSchema: z.ZodObject<{
    method: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    method: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    method: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const QueryCachingSchema: z.ZodOptional<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    ttl: z.ZodDefault<z.ZodNumber>;
    key: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    ttl: number;
    key?: string | undefined;
}, {
    enabled?: boolean | undefined;
    ttl?: number | undefined;
    key?: string | undefined;
}>>;
export declare const QuerySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    toolId: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodString>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    operation: z.ZodObject<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>;
    outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    caching: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        ttl: z.ZodDefault<z.ZodNumber>;
        key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
    executionCount: z.ZodDefault<z.ZodNumber>;
    lastExecuted: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: string;
    id: string;
    toolId: string;
    createdAt: string;
    name: string;
    parameters: Record<string, any>;
    operation: {
        method: string;
        parameters: string[];
        path?: string | undefined;
        body?: Record<string, any> | undefined;
        headers?: Record<string, string> | undefined;
        template?: string | undefined;
    } & {
        [k: string]: unknown;
    };
    executionCount: number;
    description?: string | undefined;
    updatedAt?: string | undefined;
    timeout?: number | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    } | undefined;
    lastExecuted?: string | undefined;
}, {
    id: string;
    toolId: string;
    createdAt: string;
    name: string;
    parameters: Record<string, any>;
    operation: {
        method: string;
        path?: string | undefined;
        body?: Record<string, any> | undefined;
        headers?: Record<string, string> | undefined;
        template?: string | undefined;
        parameters?: string[] | undefined;
    } & {
        [k: string]: unknown;
    };
    schemaVersion?: string | undefined;
    description?: string | undefined;
    updatedAt?: string | undefined;
    timeout?: number | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    } | undefined;
    executionCount?: number | undefined;
    lastExecuted?: string | undefined;
}>;
export type Query = z.infer<typeof QuerySchema>;
export declare const QueryUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    toolId: z.ZodOptional<z.ZodString>;
    schemaVersion: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    operation: z.ZodOptional<z.ZodObject<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    outputSchema: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    caching: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        ttl: z.ZodDefault<z.ZodNumber>;
        key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    }>>>;
    timeout: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    executionCount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    lastExecuted: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "id" | "createdAt" | "executionCount" | "lastExecuted">, "strip", z.ZodTypeAny, {
    schemaVersion?: string | undefined;
    toolId?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    updatedAt?: string | undefined;
    timeout?: number | undefined;
    parameters?: Record<string, any> | undefined;
    operation?: z.objectOutputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    } | undefined;
}, {
    schemaVersion?: string | undefined;
    toolId?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    updatedAt?: string | undefined;
    timeout?: number | undefined;
    parameters?: Record<string, any> | undefined;
    operation?: z.objectInputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    } | undefined;
}>;
export type QueryUpdate = z.infer<typeof QueryUpdateSchema>;
export declare const QueryCreateSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    toolId: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodString>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    operation: z.ZodObject<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        template: z.ZodOptional<z.ZodString>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>;
    outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    caching: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        ttl: z.ZodDefault<z.ZodNumber>;
        key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
    executionCount: z.ZodDefault<z.ZodNumber>;
    lastExecuted: z.ZodOptional<z.ZodString>;
}, "id" | "createdAt" | "updatedAt" | "executionCount" | "lastExecuted">, "strip", z.ZodTypeAny, {
    schemaVersion: string;
    toolId: string;
    name: string;
    parameters: Record<string, any>;
    operation: {
        method: string;
        parameters: string[];
        path?: string | undefined;
        body?: Record<string, any> | undefined;
        headers?: Record<string, string> | undefined;
        template?: string | undefined;
    } & {
        [k: string]: unknown;
    };
    description?: string | undefined;
    timeout?: number | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled: boolean;
        ttl: number;
        key?: string | undefined;
    } | undefined;
}, {
    toolId: string;
    name: string;
    parameters: Record<string, any>;
    operation: {
        method: string;
        path?: string | undefined;
        body?: Record<string, any> | undefined;
        headers?: Record<string, string> | undefined;
        template?: string | undefined;
        parameters?: string[] | undefined;
    } & {
        [k: string]: unknown;
    };
    schemaVersion?: string | undefined;
    description?: string | undefined;
    timeout?: number | undefined;
    outputSchema?: Record<string, any> | undefined;
    caching?: {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
        key?: string | undefined;
    } | undefined;
}>;
export type QueryCreate = z.infer<typeof QueryCreateSchema>;
export declare const QueryExecutionParamsSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export type QueryExecutionParams = z.infer<typeof QueryExecutionParamsSchema>;
export declare const QueryValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: string[];
    warnings: string[];
}, {
    valid: boolean;
    errors: string[];
    warnings?: string[] | undefined;
}>;
export type QueryValidationResult = z.infer<typeof QueryValidationResultSchema>;
export declare const QueryExecutionResultSchema: z.ZodObject<{
    executionId: z.ZodString;
    queryId: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    cached: z.ZodDefault<z.ZodBoolean>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    cached: boolean;
    executionId: string;
    queryId: string;
    startedAt: string;
    error?: string | undefined;
    duration?: number | undefined;
    result?: any;
    completedAt?: string | undefined;
}, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    executionId: string;
    queryId: string;
    startedAt: string;
    error?: string | undefined;
    cached?: boolean | undefined;
    duration?: number | undefined;
    result?: any;
    completedAt?: string | undefined;
}>;
export type QueryExecutionResult = z.infer<typeof QueryExecutionResultSchema>;
export declare const QueryListFiltersSchema: z.ZodObject<{
    toolId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    schemaVersion: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    createdAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    createdBefore: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastExecutedAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    executionCountMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    schemaVersion?: string | undefined;
    toolId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastExecutedAfter?: string | undefined;
    executionCountMin?: number | undefined;
}, {
    schemaVersion?: string | undefined;
    toolId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastExecutedAfter?: string | undefined;
    executionCountMin?: number | undefined;
}>;
export type QueryListFilters = z.infer<typeof QueryListFiltersSchema>;
export declare const QueryStatsSchema: z.ZodObject<{
    totalQueries: z.ZodNumber;
    totalExecutions: z.ZodNumber;
    averageExecutionTime: z.ZodOptional<z.ZodNumber>;
    mostUsedQuery: z.ZodOptional<z.ZodString>;
    recentExecutions: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalQueries: number;
    totalExecutions: number;
    recentExecutions: number;
    averageExecutionTime?: number | undefined;
    mostUsedQuery?: string | undefined;
}, {
    totalQueries: number;
    totalExecutions: number;
    recentExecutions: number;
    averageExecutionTime?: number | undefined;
    mostUsedQuery?: string | undefined;
}>;
export type QueryStats = z.infer<typeof QueryStatsSchema>;
export declare const PreparedOperationSchema: z.ZodObject<{
    resolvedPath: z.ZodOptional<z.ZodString>;
    resolvedTemplate: z.ZodOptional<z.ZodString>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    parameters: Record<string, any>;
    body?: Record<string, any> | undefined;
    headers?: Record<string, string> | undefined;
    resolvedPath?: string | undefined;
    resolvedTemplate?: string | undefined;
}, {
    parameters: Record<string, any>;
    body?: Record<string, any> | undefined;
    headers?: Record<string, string> | undefined;
    resolvedPath?: string | undefined;
    resolvedTemplate?: string | undefined;
}>;
export type PreparedOperation = z.infer<typeof PreparedOperationSchema>;
export declare class QueryModel {
    /**
     * Validates a query object against the schema
     */
    static validate(query: unknown): QueryValidationResult;
    /**
     * Validates query creation input
     */
    static validateCreate(queryData: unknown): QueryValidationResult;
    /**
     * Validates execution parameters against query parameter schema
     */
    static validateExecutionParams(query: Query, params: QueryExecutionParams): QueryValidationResult;
    /**
     * Creates a new query with generated fields
     */
    static create(queryData: QueryCreate): Query;
    /**
     * Updates a query with new data
     */
    static update(existingQuery: Query, updateData: QueryUpdate): Query;
    /**
     * Prepares query operation by resolving templates with parameters
     */
    static prepareOperation(query: Query, params: QueryExecutionParams): PreparedOperation;
    /**
     * Resolves template string with parameter values
     */
    private static resolveTemplate;
    /**
     * Basic JSON Schema to Zod conversion (limited implementation)
     */
    private static jsonSchemaToZod;
    /**
     * Checks if query schema is compatible with another version
     */
    static isSchemaCompatible(query1: Query, query2: Query): boolean;
    /**
     * Converts database row to Query object
     */
    static fromDatabase(row: any): Query;
    /**
     * Converts Query object to database row format
     */
    static toDatabase(query: Query): Record<string, any>;
    /**
     * Generates cache key for query result
     */
    static generateCacheKey(query: Query, params: QueryExecutionParams): string;
    /**
     * Simple object hash function
     */
    private static hashObject;
}
//# sourceMappingURL=query.d.ts.map