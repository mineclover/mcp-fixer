import { z } from 'zod';
export declare const ToolStatus: z.ZodEnum<["active", "inactive", "deprecated"]>;
export type ToolStatusType = z.infer<typeof ToolStatus>;
export declare const AuthConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
    required: z.ZodDefault<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "api_key" | "bearer" | "basic" | "oauth";
    required: boolean;
    description?: string | undefined;
    fields?: Record<string, any> | undefined;
}, {
    type: "api_key" | "bearer" | "basic" | "oauth";
    required?: boolean | undefined;
    description?: string | undefined;
    fields?: Record<string, any> | undefined;
}>;
export declare const CapabilitiesSchema: z.ZodArray<z.ZodString, "many">;
export declare const DiscoveryDataSchema: z.ZodObject<{
    discoveredAt: z.ZodString;
    endpoint: z.ZodString;
    responseTime: z.ZodOptional<z.ZodNumber>;
    serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    discoveredAt: z.ZodString;
    endpoint: z.ZodString;
    responseTime: z.ZodOptional<z.ZodNumber>;
    serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    discoveredAt: z.ZodString;
    endpoint: z.ZodString;
    responseTime: z.ZodOptional<z.ZodNumber>;
    serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    authConfig: z.ZodObject<{
        type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }>;
    schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    discoveryData: z.ZodOptional<z.ZodObject<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "deprecated"]>>;
    lastChecked: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "deprecated";
    version: string;
    id: string;
    createdAt: string;
    endpoint: string;
    name: string;
    capabilities: string[];
    authConfig: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    };
    lastChecked: string;
    description?: string | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    updatedAt?: string | undefined;
}, {
    version: string;
    id: string;
    createdAt: string;
    endpoint: string;
    name: string;
    capabilities: string[];
    authConfig: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    };
    lastChecked: string;
    status?: "active" | "inactive" | "deprecated" | undefined;
    description?: string | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    updatedAt?: string | undefined;
}>;
export type Tool = z.infer<typeof ToolSchema>;
export declare const ToolUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    endpoint: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    authConfig: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }>>;
    schema: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    discoveryData: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "inactive", "deprecated"]>>>;
    lastChecked: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "deprecated" | undefined;
    version?: string | undefined;
    description?: string | undefined;
    endpoint?: string | undefined;
    name?: string | undefined;
    capabilities?: string[] | undefined;
    authConfig?: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    } | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    lastChecked?: string | undefined;
    updatedAt?: string | undefined;
}, {
    status?: "active" | "inactive" | "deprecated" | undefined;
    version?: string | undefined;
    description?: string | undefined;
    endpoint?: string | undefined;
    name?: string | undefined;
    capabilities?: string[] | undefined;
    authConfig?: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    } | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    lastChecked?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type ToolUpdate = z.infer<typeof ToolUpdateSchema>;
export declare const ToolCreateSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    authConfig: z.ZodObject<{
        type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }, {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    }>;
    schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    discoveryData: z.ZodOptional<z.ZodObject<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "deprecated"]>>;
    lastChecked: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "id" | "createdAt" | "lastChecked" | "updatedAt"> & {
    lastChecked: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "deprecated";
    version: string;
    endpoint: string;
    name: string;
    capabilities: string[];
    authConfig: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required: boolean;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    };
    description?: string | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectOutputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    lastChecked?: string | undefined;
}, {
    version: string;
    endpoint: string;
    name: string;
    capabilities: string[];
    authConfig: {
        type: "api_key" | "bearer" | "basic" | "oauth";
        required?: boolean | undefined;
        description?: string | undefined;
        fields?: Record<string, any> | undefined;
    };
    status?: "active" | "inactive" | "deprecated" | undefined;
    description?: string | undefined;
    schema?: Record<string, any> | undefined;
    discoveryData?: z.objectInputType<{
        discoveredAt: z.ZodString;
        endpoint: z.ZodString;
        responseTime: z.ZodOptional<z.ZodNumber>;
        serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    lastChecked?: string | undefined;
}>;
export type ToolCreate = z.infer<typeof ToolCreateSchema>;
export declare const ToolDiscoveryResultSchema: z.ZodObject<{
    tools: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodString;
        capabilities: z.ZodArray<z.ZodString, "many">;
        authConfig: z.ZodObject<{
            type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
            required: z.ZodDefault<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required: boolean;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        }, {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required?: boolean | undefined;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        }>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        discoveryData: z.ZodOptional<z.ZodObject<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough">>>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "deprecated"]>>;
        lastChecked: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "id" | "createdAt" | "lastChecked" | "updatedAt"> & {
        lastChecked: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "inactive" | "deprecated";
        version: string;
        endpoint: string;
        name: string;
        capabilities: string[];
        authConfig: {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required: boolean;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        };
        description?: string | undefined;
        schema?: Record<string, any> | undefined;
        discoveryData?: z.objectOutputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        lastChecked?: string | undefined;
    }, {
        version: string;
        endpoint: string;
        name: string;
        capabilities: string[];
        authConfig: {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required?: boolean | undefined;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        };
        status?: "active" | "inactive" | "deprecated" | undefined;
        description?: string | undefined;
        schema?: Record<string, any> | undefined;
        discoveryData?: z.objectInputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        lastChecked?: string | undefined;
    }>, "many">;
    endpoint: z.ZodString;
    status: z.ZodEnum<["success", "error", "timeout"]>;
    error: z.ZodOptional<z.ZodString>;
    responseTime: z.ZodOptional<z.ZodNumber>;
    cached: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "success" | "timeout";
    endpoint: string;
    tools: {
        status: "active" | "inactive" | "deprecated";
        version: string;
        endpoint: string;
        name: string;
        capabilities: string[];
        authConfig: {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required: boolean;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        };
        description?: string | undefined;
        schema?: Record<string, any> | undefined;
        discoveryData?: z.objectOutputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        lastChecked?: string | undefined;
    }[];
    cached: boolean;
    error?: string | undefined;
    responseTime?: number | undefined;
}, {
    status: "error" | "success" | "timeout";
    endpoint: string;
    tools: {
        version: string;
        endpoint: string;
        name: string;
        capabilities: string[];
        authConfig: {
            type: "api_key" | "bearer" | "basic" | "oauth";
            required?: boolean | undefined;
            description?: string | undefined;
            fields?: Record<string, any> | undefined;
        };
        status?: "active" | "inactive" | "deprecated" | undefined;
        description?: string | undefined;
        schema?: Record<string, any> | undefined;
        discoveryData?: z.objectInputType<{
            discoveredAt: z.ZodString;
            endpoint: z.ZodString;
            responseTime: z.ZodOptional<z.ZodNumber>;
            serverInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        lastChecked?: string | undefined;
    }[];
    error?: string | undefined;
    responseTime?: number | undefined;
    cached?: boolean | undefined;
}>;
export type ToolDiscoveryResult = z.infer<typeof ToolDiscoveryResultSchema>;
export declare const ToolValidationResultSchema: z.ZodObject<{
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
export type ToolValidationResult = z.infer<typeof ToolValidationResultSchema>;
export declare const ToolListFiltersSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["active", "inactive", "deprecated"]>>>;
    endpoint: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    capabilities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    createdAfter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    createdBefore: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "deprecated" | undefined;
    endpoint?: string | undefined;
    capabilities?: string[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
}, {
    status?: "active" | "inactive" | "deprecated" | undefined;
    endpoint?: string | undefined;
    capabilities?: string[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
}>;
export type ToolListFilters = z.infer<typeof ToolListFiltersSchema>;
export declare const ToolStatsSchema: z.ZodObject<{
    totalTools: z.ZodNumber;
    activeTools: z.ZodNumber;
    inactiveTools: z.ZodNumber;
    deprecatedTools: z.ZodNumber;
    averageResponseTime: z.ZodOptional<z.ZodNumber>;
    lastDiscoveryTime: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    totalTools: number;
    activeTools: number;
    inactiveTools: number;
    deprecatedTools: number;
    averageResponseTime?: number | undefined;
    lastDiscoveryTime?: string | undefined;
}, {
    totalTools: number;
    activeTools: number;
    inactiveTools: number;
    deprecatedTools: number;
    averageResponseTime?: number | undefined;
    lastDiscoveryTime?: string | undefined;
}>;
export type ToolStats = z.infer<typeof ToolStatsSchema>;
export declare class ToolModel {
    /**
     * Validates a tool object against the schema
     */
    static validate(tool: unknown): ToolValidationResult;
    /**
     * Validates tool creation input
     */
    static validateCreate(toolData: unknown): ToolValidationResult;
    /**
     * Validates tool capabilities against MCP specification
     */
    static validateCapabilities(capabilities: string[]): ToolValidationResult;
    /**
     * Validates authentication configuration
     */
    static validateAuthConfig(authConfig: unknown): ToolValidationResult;
    /**
     * Creates a new tool with generated fields
     */
    static create(toolData: ToolCreate): Tool;
    /**
     * Updates a tool with new data
     */
    static update(existingTool: Tool, updateData: ToolUpdate): Tool;
    /**
     * Checks if a tool is compatible with another tool (same name, compatible version)
     */
    static isCompatible(tool1: Tool, tool2: Tool): boolean;
    /**
     * Converts database row to Tool object
     */
    static fromDatabase(row: any): Tool;
    /**
     * Converts Tool object to database row format
     */
    static toDatabase(tool: Tool): Record<string, any>;
    /**
     * Sanitizes tool data for API responses (removes sensitive information)
     */
    static sanitize(tool: Tool): Omit<Tool, 'authConfig'> & {
        authType: string;
    };
}
//# sourceMappingURL=tool.d.ts.map