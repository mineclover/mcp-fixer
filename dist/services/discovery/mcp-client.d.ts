import { z } from 'zod';
import { Tool } from '../../models/tool.js';
import { AuthManager } from '../auth/auth-manager.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';
declare const MCPRequestSchema: z.ZodObject<{
    method: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    method: string;
    params?: Record<string, any> | undefined;
    id?: string | number | undefined;
}, {
    method: string;
    params?: Record<string, any> | undefined;
    id?: string | number | undefined;
}>;
declare const MCPResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodNumber;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: number;
        message: string;
        data?: any;
    }, {
        code: number;
        message: string;
        data?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    error?: {
        code: number;
        message: string;
        data?: any;
    } | undefined;
    id?: string | number | undefined;
    result?: any;
}, {
    error?: {
        code: number;
        message: string;
        data?: any;
    } | undefined;
    id?: string | number | undefined;
    result?: any;
}>;
export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
declare const MCPClientOptionsSchema: z.ZodObject<{
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    userAgent: z.ZodDefault<z.ZodString>;
    validateResponse: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    userAgent: string;
    validateResponse: boolean;
}, {
    retryAttempts?: number | undefined;
    retryDelay?: number | undefined;
    timeout?: number | undefined;
    userAgent?: string | undefined;
    validateResponse?: boolean | undefined;
}>;
export type MCPClientOptions = z.infer<typeof MCPClientOptionsSchema>;
declare const MCPOperationResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    responseTime: z.ZodNumber;
    requestId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    responseTime: number;
    success: boolean;
    error?: string | undefined;
    data?: any;
    requestId?: string | number | undefined;
}, {
    responseTime: number;
    success: boolean;
    error?: string | undefined;
    data?: any;
    requestId?: string | number | undefined;
}>;
export type MCPOperationResult = z.infer<typeof MCPOperationResultSchema>;
export declare class MCPClient {
    private db;
    private config;
    private authManager;
    private requestCounter;
    constructor(db: DatabaseManager, config: ConfigManager, authManager: AuthManager);
    /**
     * Call a tool method with parameters
     */
    callTool(tool: Tool, method: string, params?: Record<string, any>, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * List available resources from a tool
     */
    listResources(tool: Tool, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Read a resource from a tool
     */
    readResource(tool: Tool, uri: string, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * List available tools from an MCP server
     */
    listTools(tool: Tool, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Call a specific tool function
     */
    callToolFunction(tool: Tool, functionName: string, arguments_?: Record<string, any>, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * List available prompts from a tool
     */
    listPrompts(tool: Tool, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Get a prompt from a tool
     */
    getPrompt(tool: Tool, name: string, arguments_?: Record<string, any>, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Test connection to a tool
     */
    testConnection(tool: Tool): Promise<MCPOperationResult>;
    /**
     * Subscribe to resource updates
     */
    subscribeResource(tool: Tool, uri: string, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Unsubscribe from resource updates
     */
    unsubscribeResource(tool: Tool, uri: string, options?: Partial<MCPClientOptions>): Promise<MCPOperationResult>;
    /**
     * Get server capabilities and information
     */
    getServerInfo(tool: Tool): Promise<MCPOperationResult>;
    private makeAuthenticatedRequest;
    private makeSimpleRequest;
    private makeRequestWithRetry;
    private makeHttpRequest;
    private generateRequestId;
    /**
     * Validate tool capabilities against a requested operation
     */
    validateCapability(tool: Tool, capability: string): boolean;
    /**
     * Get supported capabilities for common operations
     */
    static getRequiredCapabilities(): Record<string, string>;
    /**
     * Check if a tool supports a specific operation
     */
    supportsOperation(tool: Tool, operation: string): boolean;
    /**
     * Get client statistics
     */
    getStats(): {
        requestCount: number;
        activeSessions: number;
    };
    /**
     * Reset client state
     */
    reset(): void;
}
export {};
//# sourceMappingURL=mcp-client.d.ts.map