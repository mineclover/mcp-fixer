import { z } from 'zod';

// Tool status enumeration
export const ToolStatus = z.enum(['active', 'inactive', 'deprecated']);
export type ToolStatusType = z.infer<typeof ToolStatus>;

// MCP authentication configuration schema
export const AuthConfigSchema = z.object({
  type: z.enum(['api_key', 'bearer', 'basic', 'oauth']),
  required: z.boolean().default(true),
  description: z.string().optional(),
  fields: z.record(z.string(), z.any()).optional(),
});

// MCP tool capabilities schema
export const CapabilitiesSchema = z.array(z.string());

// Tool discovery metadata schema
export const DiscoveryDataSchema = z.object({
  discoveredAt: z.string().datetime(),
  endpoint: z.string().url(),
  responseTime: z.number().optional(),
  serverInfo: z.record(z.string(), z.any()).optional(),
}).passthrough();

// Tool schema definition
export const ToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  version: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  endpoint: z.string().url(),
  capabilities: CapabilitiesSchema,
  authConfig: AuthConfigSchema,
  schema: z.record(z.string(), z.any()).optional(),
  discoveryData: DiscoveryDataSchema.optional(),
  status: ToolStatus.default('active'),
  lastChecked: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export type Tool = z.infer<typeof ToolSchema>;

// Partial tool for updates
export const ToolUpdateSchema = ToolSchema.partial().omit({ id: true, createdAt: true });
export type ToolUpdate = z.infer<typeof ToolUpdateSchema>;

// Tool creation input (without generated fields)
export const ToolCreateSchema = ToolSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChecked: true,
}).extend({
  lastChecked: z.string().datetime().optional(),
});
export type ToolCreate = z.infer<typeof ToolCreateSchema>;

// Tool discovery result
export const ToolDiscoveryResultSchema = z.object({
  tools: z.array(ToolCreateSchema),
  endpoint: z.string().url(),
  status: z.enum(['success', 'error', 'timeout']),
  error: z.string().optional(),
  responseTime: z.number().optional(),
  cached: z.boolean().default(false),
});
export type ToolDiscoveryResult = z.infer<typeof ToolDiscoveryResultSchema>;

// Tool validation result
export const ToolValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type ToolValidationResult = z.infer<typeof ToolValidationResultSchema>;

// Tool list filters
export const ToolListFiltersSchema = z.object({
  status: ToolStatus.optional(),
  endpoint: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
}).partial();
export type ToolListFilters = z.infer<typeof ToolListFiltersSchema>;

// Tool statistics
export const ToolStatsSchema = z.object({
  totalTools: z.number(),
  activeTools: z.number(),
  inactiveTools: z.number(),
  deprecatedTools: z.number(),
  averageResponseTime: z.number().optional(),
  lastDiscoveryTime: z.string().datetime().optional(),
});
export type ToolStats = z.infer<typeof ToolStatsSchema>;

// Utility functions for tool model
export class ToolModel {
  /**
   * Validates a tool object against the schema
   */
  static validate(tool: unknown): ToolValidationResult {
    try {
      ToolSchema.parse(tool);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Validates tool creation input
   */
  static validateCreate(toolData: unknown): ToolValidationResult {
    try {
      ToolCreateSchema.parse(toolData);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Validates tool capabilities against MCP specification
   */
  static validateCapabilities(capabilities: string[]): ToolValidationResult {
    const validCapabilities = [
      'list_resources',
      'read_resource',
      'subscribe_resource',
      'list_tools',
      'call_tool',
      'list_prompts',
      'get_prompt',
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const capability of capabilities) {
      if (!validCapabilities.includes(capability)) {
        warnings.push(`Unknown capability: ${capability}`);
      }
    }

    if (capabilities.length === 0) {
      errors.push('At least one capability must be specified');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates authentication configuration
   */
  static validateAuthConfig(authConfig: unknown): ToolValidationResult {
    try {
      AuthConfigSchema.parse(authConfig);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `auth.${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [`Invalid auth config: ${String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * Creates a new tool with generated fields
   */
  static create(toolData: ToolCreate): Tool {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastChecked: toolData.lastChecked ?? now,
      ...toolData,
    };
  }

  /**
   * Updates a tool with new data
   */
  static update(existingTool: Tool, updateData: ToolUpdate): Tool {
    return {
      ...existingTool,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Checks if a tool is compatible with another tool (same name, compatible version)
   */
  static isCompatible(tool1: Tool, tool2: Tool): boolean {
    if (tool1.name !== tool2.name) {
      return false;
    }

    // Simple semantic version compatibility check
    const version1Parts = tool1.version.split('.').map(Number);
    const version2Parts = tool2.version.split('.').map(Number);

    // Same major version is considered compatible
    return version1Parts[0] === version2Parts[0];
  }

  /**
   * Converts database row to Tool object
   */
  static fromDatabase(row: any): Tool {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description || undefined,
      endpoint: row.endpoint,
      capabilities: JSON.parse(row.capabilities),
      authConfig: JSON.parse(row.auth_config),
      schema: row.schema ? JSON.parse(row.schema) : undefined,
      discoveryData: row.discovery_data ? JSON.parse(row.discovery_data) : undefined,
      status: row.status as ToolStatusType,
      lastChecked: row.last_checked,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined,
    };
  }

  /**
   * Converts Tool object to database row format
   */
  static toDatabase(tool: Tool): Record<string, any> {
    return {
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description || null,
      endpoint: tool.endpoint,
      capabilities: JSON.stringify(tool.capabilities),
      auth_config: JSON.stringify(tool.authConfig),
      schema: tool.schema ? JSON.stringify(tool.schema) : null,
      discovery_data: tool.discoveryData ? JSON.stringify(tool.discoveryData) : null,
      status: tool.status,
      last_checked: tool.lastChecked,
      created_at: tool.createdAt,
      updated_at: tool.updatedAt || null,
    };
  }

  /**
   * Sanitizes tool data for API responses (removes sensitive information)
   */
  static sanitize(tool: Tool): Omit<Tool, 'authConfig'> & { authType: string } {
    const { authConfig, ...sanitizedTool } = tool;
    return {
      ...sanitizedTool,
      authType: authConfig.type,
    };
  }
}