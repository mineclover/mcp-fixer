import { z } from 'zod';
import { Tool, ToolCreate, ToolDiscoveryResult } from '../../models/tool.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';
declare const DiscoveryOptionsSchema: z.ZodObject<{
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    maxConcurrency: z.ZodDefault<z.ZodNumber>;
    cacheTimeout: z.ZodDefault<z.ZodNumber>;
    userAgent: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cacheTimeout: number;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    userAgent: string;
}, {
    cacheTimeout?: number | undefined;
    maxConcurrency?: number | undefined;
    retryAttempts?: number | undefined;
    retryDelay?: number | undefined;
    timeout?: number | undefined;
    userAgent?: string | undefined;
}>;
export type DiscoveryOptions = z.infer<typeof DiscoveryOptionsSchema>;
declare const EndpointConfigSchema: z.ZodObject<{
    url: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    method: z.ZodDefault<z.ZodEnum<["GET", "POST"]>>;
    body: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    method: "GET" | "POST";
    url: string;
    body?: string | undefined;
    headers?: Record<string, string> | undefined;
}, {
    url: string;
    method?: "GET" | "POST" | undefined;
    body?: string | undefined;
    headers?: Record<string, string> | undefined;
}>;
export type EndpointConfig = z.infer<typeof EndpointConfigSchema>;
export declare class ToolDiscoveryService {
    private db;
    private config;
    private cache;
    private activeDiscoveries;
    constructor(db: DatabaseManager, config: ConfigManager);
    /**
     * Discover tools from a specific endpoint
     */
    discoverFromEndpoint(endpoint: string, options?: Partial<DiscoveryOptions>): Promise<ToolDiscoveryResult>;
    /**
     * Discover tools from multiple endpoints concurrently
     */
    discoverFromEndpoints(endpoints: string[], options?: Partial<DiscoveryOptions>): Promise<ToolDiscoveryResult[]>;
    /**
     * Auto-discover local MCP tools
     */
    autoDiscoverLocal(): Promise<ToolDiscoveryResult>;
    /**
     * Save discovered tools to database
     */
    saveTools(tools: ToolCreate[]): Promise<{
        saved: Tool[];
        skipped: number;
        errors: string[];
    }>;
    /**
     * Refresh capabilities for existing tools
     */
    refreshToolCapabilities(toolIds?: string[]): Promise<{
        refreshed: Tool[];
        errors: string[];
    }>;
    /**
     * Get discovery statistics
     */
    getStats(): {
        totalEndpoints: number;
        cacheHits: number;
        activeDiscoveries: number;
        cacheSize: number;
    };
    /**
     * Clear discovery cache
     */
    clearCache(): void;
    private performDiscovery;
    private discoverWithRetry;
    private makeDiscoveryRequest;
    private parseMCPCapabilities;
    private updateExistingTool;
    private getEnvironmentEndpoints;
    private getCacheKey;
    private getFromCache;
    private setCache;
    private chunkArray;
}
export {};
//# sourceMappingURL=tool-discovery.d.ts.map