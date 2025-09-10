import { z } from 'zod';
export declare const CollectorStatus: z.ZodEnum<["enabled", "disabled", "error"]>;
export type CollectorStatusType = z.infer<typeof CollectorStatus>;
export declare const CollectorContextSchema: z.ZodObject<{
    collectorId: z.ZodString;
    executionId: z.ZodString;
    input: z.ZodRecord<z.ZodString, z.ZodAny>;
    timeout: z.ZodNumber;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    executionId: string;
    collectorId: string;
    input: Record<string, any>;
    environment?: Record<string, string> | undefined;
}, {
    timeout: number;
    executionId: string;
    collectorId: string;
    input: Record<string, any>;
    environment?: Record<string, string> | undefined;
}>;
export type CollectorContext = z.infer<typeof CollectorContextSchema>;
export declare const CollectorExecutionResultSchema: z.ZodObject<{
    executionId: z.ZodString;
    collectorId: z.ZodString;
    success: z.ZodBoolean;
    output: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    startedAt: z.ZodString;
    completedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    duration: number;
    executionId: string;
    startedAt: string;
    completedAt: string;
    collectorId: string;
    error?: string | undefined;
    output?: any;
}, {
    success: boolean;
    duration: number;
    executionId: string;
    startedAt: string;
    completedAt: string;
    collectorId: string;
    error?: string | undefined;
    output?: any;
}>;
export type CollectorExecutionResult = z.infer<typeof CollectorExecutionResultSchema>;
export declare const CollectorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    timeout: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    version: z.ZodDefault<z.ZodString>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    createdAt: z.ZodString;
    lastExecuted: z.ZodOptional<z.ZodString>;
    executionCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    version: string;
    id: string;
    createdAt: string;
    name: string;
    timeout: number;
    enabled: boolean;
    outputSchema: Record<string, any>;
    executionCount: number;
    filePath: string;
    inputSchema: Record<string, any>;
    dependencies: string[];
    description?: string | undefined;
    lastExecuted?: string | undefined;
    environment?: Record<string, string> | undefined;
}, {
    id: string;
    createdAt: string;
    name: string;
    outputSchema: Record<string, any>;
    filePath: string;
    inputSchema: Record<string, any>;
    version?: string | undefined;
    description?: string | undefined;
    timeout?: number | undefined;
    enabled?: boolean | undefined;
    executionCount?: number | undefined;
    lastExecuted?: string | undefined;
    environment?: Record<string, string> | undefined;
    dependencies?: string[] | undefined;
}>;
export type Collector = z.infer<typeof CollectorSchema>;
export declare const CollectorCreateSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    filePath: z.ZodString;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    timeout: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    version: z.ZodDefault<z.ZodString>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    createdAt: z.ZodString;
    lastExecuted: z.ZodOptional<z.ZodString>;
    executionCount: z.ZodDefault<z.ZodNumber>;
}, "id" | "createdAt" | "executionCount" | "lastExecuted">, "strip", z.ZodTypeAny, {
    version: string;
    name: string;
    timeout: number;
    enabled: boolean;
    outputSchema: Record<string, any>;
    filePath: string;
    inputSchema: Record<string, any>;
    dependencies: string[];
    description?: string | undefined;
    environment?: Record<string, string> | undefined;
}, {
    name: string;
    outputSchema: Record<string, any>;
    filePath: string;
    inputSchema: Record<string, any>;
    version?: string | undefined;
    description?: string | undefined;
    timeout?: number | undefined;
    enabled?: boolean | undefined;
    environment?: Record<string, string> | undefined;
    dependencies?: string[] | undefined;
}>;
export type CollectorCreate = z.infer<typeof CollectorCreateSchema>;
export declare const CollectorUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    filePath: z.ZodOptional<z.ZodString>;
    inputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timeout: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    enabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    version: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    dependencies: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    environment: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
    createdAt: z.ZodOptional<z.ZodString>;
    lastExecuted: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    executionCount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "id" | "createdAt" | "executionCount">, "strip", z.ZodTypeAny, {
    version?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    timeout?: number | undefined;
    enabled?: boolean | undefined;
    outputSchema?: Record<string, any> | undefined;
    lastExecuted?: string | undefined;
    environment?: Record<string, string> | undefined;
    filePath?: string | undefined;
    inputSchema?: Record<string, any> | undefined;
    dependencies?: string[] | undefined;
}, {
    version?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    timeout?: number | undefined;
    enabled?: boolean | undefined;
    outputSchema?: Record<string, any> | undefined;
    lastExecuted?: string | undefined;
    environment?: Record<string, string> | undefined;
    filePath?: string | undefined;
    inputSchema?: Record<string, any> | undefined;
    dependencies?: string[] | undefined;
}>;
export type CollectorUpdate = z.infer<typeof CollectorUpdateSchema>;
export declare const CollectorModuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    timeout: z.ZodDefault<z.ZodNumber>;
    collect: z.ZodFunction<z.ZodTuple<[z.ZodAny, z.ZodOptional<z.ZodAny>], z.ZodUnknown>, z.ZodPromise<z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    name: string;
    timeout: number;
    outputSchema: Record<string, any>;
    inputSchema: Record<string, any>;
    dependencies: string[];
    collect: (args_0: any, args_1: any, ...args: unknown[]) => Promise<any>;
    description?: string | undefined;
}, {
    name: string;
    outputSchema: Record<string, any>;
    inputSchema: Record<string, any>;
    collect: (args_0: any, args_1: any, ...args: unknown[]) => Promise<any>;
    version?: string | undefined;
    description?: string | undefined;
    timeout?: number | undefined;
    dependencies?: string[] | undefined;
}>;
export type CollectorModule = z.infer<typeof CollectorModuleSchema>;
export declare const CollectorValidationResultSchema: z.ZodObject<{
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
export type CollectorValidationResult = z.infer<typeof CollectorValidationResultSchema>;
export declare const CollectorListFiltersSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    createdAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastExecutedAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    createdAfter?: string | undefined;
    enabled?: boolean | undefined;
    lastExecutedAfter?: string | undefined;
}, {
    name?: string | undefined;
    createdAfter?: string | undefined;
    enabled?: boolean | undefined;
    lastExecutedAfter?: string | undefined;
}>;
export type CollectorListFilters = z.infer<typeof CollectorListFiltersSchema>;
export declare const CollectorStatsSchema: z.ZodObject<{
    totalCollectors: z.ZodNumber;
    enabledCollectors: z.ZodNumber;
    disabledCollectors: z.ZodNumber;
    totalExecutions: z.ZodNumber;
    averageExecutionTime: z.ZodOptional<z.ZodNumber>;
    successRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    totalExecutions: number;
    totalCollectors: number;
    enabledCollectors: number;
    disabledCollectors: number;
    averageExecutionTime?: number | undefined;
    successRate?: number | undefined;
}, {
    totalExecutions: number;
    totalCollectors: number;
    enabledCollectors: number;
    disabledCollectors: number;
    averageExecutionTime?: number | undefined;
    successRate?: number | undefined;
}>;
export type CollectorStats = z.infer<typeof CollectorStatsSchema>;
export declare const CollectorChainResultSchema: z.ZodObject<{
    executionId: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        executionId: z.ZodString;
        collectorId: z.ZodString;
        success: z.ZodBoolean;
        output: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodString>;
        duration: z.ZodNumber;
        startedAt: z.ZodString;
        completedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        duration: number;
        executionId: string;
        startedAt: string;
        completedAt: string;
        collectorId: string;
        error?: string | undefined;
        output?: any;
    }, {
        success: boolean;
        duration: number;
        executionId: string;
        startedAt: string;
        completedAt: string;
        collectorId: string;
        error?: string | undefined;
        output?: any;
    }>, "many">;
    success: z.ZodBoolean;
    duration: z.ZodNumber;
    startedAt: z.ZodString;
    completedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    duration: number;
    executionId: string;
    startedAt: string;
    completedAt: string;
    results: {
        success: boolean;
        duration: number;
        executionId: string;
        startedAt: string;
        completedAt: string;
        collectorId: string;
        error?: string | undefined;
        output?: any;
    }[];
}, {
    success: boolean;
    duration: number;
    executionId: string;
    startedAt: string;
    completedAt: string;
    results: {
        success: boolean;
        duration: number;
        executionId: string;
        startedAt: string;
        completedAt: string;
        collectorId: string;
        error?: string | undefined;
        output?: any;
    }[];
}>;
export type CollectorChainResult = z.infer<typeof CollectorChainResultSchema>;
export declare class CollectorModel {
    /**
     * Validates a collector object against the schema
     */
    static validate(collector: unknown): CollectorValidationResult;
    /**
     * Validates collector creation input
     */
    static validateCreate(collectorData: unknown): CollectorValidationResult;
    /**
     * Validates collector module structure
     */
    static validateModule(filePath: string): Promise<CollectorValidationResult>;
    /**
     * Validates input against collector's input schema
     */
    static validateInput(collector: Collector, input: any): CollectorValidationResult;
    /**
     * Validates output against collector's output schema
     */
    static validateOutput(collector: Collector, output: any): CollectorValidationResult;
    /**
     * Creates a new collector with generated fields
     */
    static create(collectorData: CollectorCreate): Collector;
    /**
     * Updates a collector with new data
     */
    static update(existingCollector: Collector, updateData: CollectorUpdate): Collector;
    /**
     * Loads collector module from file system
     */
    static loadModule(filePath: string): Promise<CollectorModule>;
    /**
     * Creates collector from loaded module
     */
    static fromModule(filePath: string, module: CollectorModule): CollectorCreate;
    /**
     * Checks if collector dependencies are satisfied
     */
    static checkDependencies(collector: Collector, availableCollectors: Collector[]): CollectorValidationResult;
    /**
     * Resolves execution order for collector chain
     */
    static resolveExecutionOrder(collectors: Collector[]): Collector[];
    /**
     * Basic JSON Schema to Zod conversion (reused from Query model)
     */
    private static jsonSchemaToZod;
    /**
     * Converts database row to Collector object
     */
    static fromDatabase(row: any): Collector;
    /**
     * Converts Collector object to database row format
     */
    static toDatabase(collector: Collector): Record<string, any>;
    /**
     * Creates execution context for collector
     */
    static createContext(collector: Collector, input: any, executionId: string): CollectorContext;
}
//# sourceMappingURL=collector.d.ts.map