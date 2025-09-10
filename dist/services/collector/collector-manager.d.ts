import { z } from 'zod';
import { Collector } from '../../models/collector.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';
declare const CollectorExecutionOptionsSchema: z.ZodObject<{
    timeout: z.ZodDefault<z.ZodNumber>;
    validateInput: z.ZodDefault<z.ZodBoolean>;
    validateOutput: z.ZodDefault<z.ZodBoolean>;
    captureOutput: z.ZodDefault<z.ZodBoolean>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    validateOutput: boolean;
    validateInput: boolean;
    captureOutput: boolean;
    workingDirectory?: string | undefined;
}, {
    timeout?: number | undefined;
    validateOutput?: boolean | undefined;
    validateInput?: boolean | undefined;
    captureOutput?: boolean | undefined;
    workingDirectory?: string | undefined;
}>;
export type CollectorExecutionOptions = z.infer<typeof CollectorExecutionOptionsSchema>;
declare const CollectorExecutionResultSchema: z.ZodObject<{
    collectorId: z.ZodString;
    executionTime: z.ZodNumber;
    output: z.ZodAny;
    status: z.ZodEnum<["success", "error", "timeout"]>;
    error: z.ZodOptional<z.ZodString>;
    stdout: z.ZodOptional<z.ZodString>;
    stderr: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "success" | "timeout";
    executionTime: number;
    collectorId: string;
    error?: string | undefined;
    output?: any;
    stdout?: string | undefined;
    stderr?: string | undefined;
    exitCode?: number | undefined;
}, {
    status: "error" | "success" | "timeout";
    executionTime: number;
    collectorId: string;
    error?: string | undefined;
    output?: any;
    stdout?: string | undefined;
    stderr?: string | undefined;
    exitCode?: number | undefined;
}>;
export type CollectorExecutionResult = z.infer<typeof CollectorExecutionResultSchema>;
declare const CollectorValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["node", "python", "shell", "executable"]>;
        hasInputSchema: z.ZodBoolean;
        hasOutputSchema: z.ZodBoolean;
        hasMetadata: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        type: "node" | "python" | "shell" | "executable";
        hasInputSchema: boolean;
        hasOutputSchema: boolean;
        hasMetadata: boolean;
    }, {
        type: "node" | "python" | "shell" | "executable";
        hasInputSchema: boolean;
        hasOutputSchema: boolean;
        hasMetadata: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: {
        type: "node" | "python" | "shell" | "executable";
        hasInputSchema: boolean;
        hasOutputSchema: boolean;
        hasMetadata: boolean;
    } | undefined;
}, {
    valid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: {
        type: "node" | "python" | "shell" | "executable";
        hasInputSchema: boolean;
        hasOutputSchema: boolean;
        hasMetadata: boolean;
    } | undefined;
}>;
export type CollectorValidationResult = z.infer<typeof CollectorValidationResultSchema>;
export declare class CollectorManager {
    private db;
    private config;
    private activeExecutions;
    constructor(db: DatabaseManager, config: ConfigManager);
    /**
     * Register a new data collector
     */
    registerCollector(filePath: string, name: string, description?: string, timeout?: number): Promise<Collector>;
    /**
     * Get collector by ID or name
     */
    getCollector(identifier: string): Promise<Collector | null>;
    /**
     * List all collectors with optional filters
     */
    listCollectors(enabledOnly?: boolean): Promise<Collector[]>;
    /**
     * Execute a data collector with input parameters
     */
    executeCollector(identifier: string, input?: Record<string, any>, options?: Partial<CollectorExecutionOptions>): Promise<CollectorExecutionResult>;
    /**
     * Test a collector with sample input
     */
    testCollector(identifier: string): Promise<CollectorExecutionResult>;
    /**
     * Enable or disable a collector
     */
    setCollectorEnabled(identifier: string, enabled: boolean): Promise<boolean>;
    /**
     * Remove a collector
     */
    removeCollector(identifier: string): Promise<boolean>;
    /**
     * Get collector statistics
     */
    getCollectorStats(): Promise<{
        totalCollectors: number;
        enabledCollectors: number;
        disabledCollectors: number;
        totalExecutions: number;
        averageExecutionTime: number;
        mostUsedCollectors: Array<{
            id: string;
            name: string;
            executionCount: number;
            lastExecuted?: string;
        }>;
    }>;
    private validateCollectorFile;
    private extractCollectorSchemas;
    private validateCollectorInput;
    private executeCollectorFile;
    private spawnProcess;
    private generateSampleInput;
    private updateCollectorStatistics;
}
export {};
//# sourceMappingURL=collector-manager.d.ts.map