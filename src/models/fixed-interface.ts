import { z } from 'zod';

// Fixed interface state transitions
export const FixedInterfaceState = z.enum(['active', 'inactive', 'validating', 'invalid']);
export type FixedInterfaceStateType = z.infer<typeof FixedInterfaceState>;

// JSON Schema validation
export const JsonSchemaSchema = z.record(z.string(), z.any()).refine(
  (schema) => {
    // Basic JSON Schema validation - must have type property
    return schema && typeof schema === 'object' && 'type' in schema;
  },
  { message: 'Must be a valid JSON Schema object' }
);

// Parameters schema for interface operations
export const ParametersSchema = z.record(z.string(), z.any());

// Response schema for interface operations
export const ResponseSchemaSchema = z.record(z.string(), z.any());

// Fixed interface core schema
export const FixedInterfaceSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  schemaJson: JsonSchemaSchema,
  parametersJson: ParametersSchema,
  responseSchemaJson: ResponseSchemaSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  lastValidated: z.string().datetime().optional(),
  validationErrors: z.string().optional(),
});

export type FixedInterface = z.infer<typeof FixedInterfaceSchema>;

// Fixed interface creation input
export const FixedInterfaceCreateSchema = FixedInterfaceSchema.omit({
  id: true,
  createdAt: true,
  lastValidated: true,
}).extend({
  toolId: z.string().uuid(),
});
export type FixedInterfaceCreate = z.infer<typeof FixedInterfaceCreateSchema>;

// Fixed interface update input
export const FixedInterfaceUpdateSchema = FixedInterfaceSchema.partial().omit({
  id: true,
  toolId: true,
  createdAt: true,
});
export type FixedInterfaceUpdate = z.infer<typeof FixedInterfaceUpdateSchema>;

// Interface validation result
export const InterfaceValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  schemaValid: z.boolean(),
  parametersValid: z.boolean(),
  responseSchemaValid: z.boolean(),
});
export type InterfaceValidationResult = z.infer<typeof InterfaceValidationResultSchema>;

// Interface execution parameters
export const InterfaceExecutionParamsSchema = z.object({
  interfaceId: z.string().uuid(),
  parameters: z.record(z.string(), z.any()),
  timeout: z.number().min(1).max(300).default(30), // 30 second default timeout
  validateResponse: z.boolean().default(true),
});
export type InterfaceExecutionParams = z.infer<typeof InterfaceExecutionParamsSchema>;

// Interface execution result
export const InterfaceExecutionResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  responseTime: z.number(), // milliseconds
  validationResult: InterfaceValidationResultSchema.optional(),
  timestamp: z.string().datetime(),
});
export type InterfaceExecutionResult = z.infer<typeof InterfaceExecutionResultSchema>;

// Fixed interface list filters
export const FixedInterfaceListFiltersSchema = z.object({
  toolId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  name: z.string().optional(),
  version: z.string().optional(),
  validationStatus: z.enum(['valid', 'invalid', 'unknown']).optional(),
}).partial();
export type FixedInterfaceListFilters = z.infer<typeof FixedInterfaceListFiltersSchema>;

// Fixed interface statistics
export const FixedInterfaceStatsSchema = z.object({
  totalInterfaces: z.number(),
  activeInterfaces: z.number(),
  inactiveInterfaces: z.number(),
  validInterfaces: z.number(),
  invalidInterfaces: z.number(),
  averageResponseTime: z.number().optional(), // milliseconds
  totalExecutions: z.number().optional(),
  successRate: z.number().min(0).max(1).optional(), // 0-1 range
});
export type FixedInterfaceStats = z.infer<typeof FixedInterfaceStatsSchema>;

// Interface state transition
export const StateTransitionSchema = z.object({
  from: FixedInterfaceState,
  to: FixedInterfaceState,
  reason: z.string(),
  timestamp: z.string().datetime(),
});
export type StateTransition = z.infer<typeof StateTransitionSchema>;

// Utility functions and validation logic
export class FixedInterfaceModel {
  /**
   * Validates a fixed interface object against the schema
   */
  static validate(fixedInterface: unknown): InterfaceValidationResult {
    try {
      FixedInterfaceSchema.parse(fixedInterface);
      
      // Additional validation for JSON schemas
      const iface = fixedInterface as FixedInterface;
      const schemaValid = this.validateJsonSchema(iface.schemaJson);
      const parametersValid = this.validateParameters(iface.parametersJson);
      const responseSchemaValid = this.validateResponseSchema(iface.responseSchemaJson);
      
      return {
        valid: schemaValid && parametersValid && responseSchemaValid,
        errors: [],
        warnings: [],
        schemaValid,
        parametersValid,
        responseSchemaValid,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
          schemaValid: false,
          parametersValid: false,
          responseSchemaValid: false,
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
        schemaValid: false,
        parametersValid: false,
        responseSchemaValid: false,
      };
    }
  }

  /**
   * Validates creation input for fixed interface
   */
  static validateCreate(interfaceData: unknown): InterfaceValidationResult {
    try {
      FixedInterfaceCreateSchema.parse(interfaceData);
      return { 
        valid: true, 
        errors: [], 
        warnings: [],
        schemaValid: true,
        parametersValid: true,
        responseSchemaValid: true,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
          schemaValid: false,
          parametersValid: false,
          responseSchemaValid: false,
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
        schemaValid: false,
        parametersValid: false,
        responseSchemaValid: false,
      };
    }
  }

  /**
   * Validates JSON schema structure
   */
  private static validateJsonSchema(schema: any): boolean {
    try {
      return typeof schema === 'object' && 
             schema !== null && 
             'type' in schema &&
             typeof schema.type === 'string';
    } catch {
      return false;
    }
  }

  /**
   * Validates parameters schema
   */
  private static validateParameters(parameters: any): boolean {
    try {
      return typeof parameters === 'object' && parameters !== null;
    } catch {
      return false;
    }
  }

  /**
   * Validates response schema
   */
  private static validateResponseSchema(responseSchema: any): boolean {
    try {
      return typeof responseSchema === 'object' && responseSchema !== null;
    } catch {
      return false;
    }
  }

  /**
   * Creates a new fixed interface with generated fields
   */
  static create(interfaceData: FixedInterfaceCreate): FixedInterface {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      ...interfaceData,
    };
  }

  /**
   * Updates a fixed interface with new data
   */
  static update(existingInterface: FixedInterface, updateData: FixedInterfaceUpdate): FixedInterface {
    return {
      ...existingInterface,
      ...updateData,
    };
  }

  /**
   * Validates state transition is allowed
   */
  static validateStateTransition(from: FixedInterfaceStateType, to: FixedInterfaceStateType): boolean {
    // Define allowed state transitions
    const allowedTransitions: Record<FixedInterfaceStateType, FixedInterfaceStateType[]> = {
      active: ['inactive', 'validating'],
      inactive: ['active', 'validating'],
      validating: ['active', 'invalid'],
      invalid: ['validating'],
    };

    return allowedTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Checks if interface schema is compatible with tool capabilities
   */
  static isCompatibleWithTool(fixedInterface: FixedInterface, toolCapabilities: string[]): boolean {
    // Basic compatibility check - ensure tool has required capabilities
    return toolCapabilities.includes('call_tool');
  }

  /**
   * Converts database row to FixedInterface object
   */
  static fromDatabase(row: any): FixedInterface {
    return {
      id: row.id,
      toolId: row.tool_id,
      name: row.name,
      displayName: row.display_name,
      description: row.description || undefined,
      schemaJson: JSON.parse(row.schema_json),
      parametersJson: JSON.parse(row.parameters_json),
      responseSchemaJson: JSON.parse(row.response_schema_json),
      version: row.version,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      lastValidated: row.last_validated || undefined,
      validationErrors: row.validation_errors || undefined,
    };
  }

  /**
   * Converts FixedInterface object to database row format
   */
  static toDatabase(fixedInterface: FixedInterface): Record<string, any> {
    return {
      id: fixedInterface.id,
      tool_id: fixedInterface.toolId,
      name: fixedInterface.name,
      display_name: fixedInterface.displayName,
      description: fixedInterface.description || null,
      schema_json: JSON.stringify(fixedInterface.schemaJson),
      parameters_json: JSON.stringify(fixedInterface.parametersJson),
      response_schema_json: JSON.stringify(fixedInterface.responseSchemaJson),
      version: fixedInterface.version,
      is_active: fixedInterface.isActive,
      created_at: fixedInterface.createdAt,
      last_validated: fixedInterface.lastValidated || null,
      validation_errors: fixedInterface.validationErrors || null,
    };
  }

  /**
   * Generates interface signature for caching and comparison
   */
  static generateSignature(fixedInterface: FixedInterface): string {
    const data = {
      name: fixedInterface.name,
      version: fixedInterface.version,
      schema: fixedInterface.schemaJson,
      parameters: fixedInterface.parametersJson,
      response: fixedInterface.responseSchemaJson,
    };
    
    // Simple hash of JSON serialized data (in production, use proper hashing)
    return btoa(JSON.stringify(data)).slice(0, 32);
  }

  /**
   * Checks if interface has been recently validated
   */
  static isRecentlyValidated(fixedInterface: FixedInterface, thresholdHours: number = 24): boolean {
    if (!fixedInterface.lastValidated) {
      return false;
    }
    
    const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
    return new Date(fixedInterface.lastValidated) > threshold;
  }
}