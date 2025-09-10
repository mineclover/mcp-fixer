import { z } from 'zod';

// Query operation schema
export const QueryOperationSchema = z.object({
  method: z.string().min(1),
  path: z.string().optional(),
  template: z.string().optional(),
  parameters: z.array(z.string()).default([]),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.any()).optional(),
}).passthrough();

// Query caching configuration
export const QueryCachingSchema = z.object({
  enabled: z.boolean().default(false),
  ttl: z.number().int().positive().default(300), // 5 minutes
  key: z.string().optional(),
}).optional();

// Query schema definition
export const QuerySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  toolId: z.string().uuid(),
  schemaVersion: z.string().default('1.0.0'),
  parameters: z.record(z.string(), z.any()), // JSON Schema for parameters
  operation: QueryOperationSchema,
  outputSchema: z.record(z.string(), z.any()).optional(), // JSON Schema for output
  caching: QueryCachingSchema,
  timeout: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  executionCount: z.number().int().min(0).default(0),
  lastExecuted: z.string().datetime().optional(),
});

export type Query = z.infer<typeof QuerySchema>;

// Partial query for updates
export const QueryUpdateSchema = QuerySchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  executionCount: true,
  lastExecuted: true 
});
export type QueryUpdate = z.infer<typeof QueryUpdateSchema>;

// Query creation input (without generated fields)
export const QueryCreateSchema = QuerySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
  lastExecuted: true,
});
export type QueryCreate = z.infer<typeof QueryCreateSchema>;

// Query execution parameters
export const QueryExecutionParamsSchema = z.record(z.string(), z.any());
export type QueryExecutionParams = z.infer<typeof QueryExecutionParamsSchema>;

// Query validation result
export const QueryValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type QueryValidationResult = z.infer<typeof QueryValidationResultSchema>;

// Query execution result
export const QueryExecutionResultSchema = z.object({
  executionId: z.string().uuid(),
  queryId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  result: z.any().optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
  cached: z.boolean().default(false),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type QueryExecutionResult = z.infer<typeof QueryExecutionResultSchema>;

// Query list filters
export const QueryListFiltersSchema = z.object({
  toolId: z.string().uuid().optional(),
  schemaVersion: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastExecutedAfter: z.string().datetime().optional(),
  executionCountMin: z.number().int().min(0).optional(),
}).partial();
export type QueryListFilters = z.infer<typeof QueryListFiltersSchema>;

// Query statistics
export const QueryStatsSchema = z.object({
  totalQueries: z.number(),
  totalExecutions: z.number(),
  averageExecutionTime: z.number().optional(),
  mostUsedQuery: z.string().optional(),
  recentExecutions: z.number(),
});
export type QueryStats = z.infer<typeof QueryStatsSchema>;

// Prepared query operation (with resolved template)
export const PreparedOperationSchema = z.object({
  resolvedPath: z.string().optional(),
  resolvedTemplate: z.string().optional(),
  parameters: QueryExecutionParamsSchema,
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.any()).optional(),
});
export type PreparedOperation = z.infer<typeof PreparedOperationSchema>;

// Utility functions for query model
export class QueryModel {
  /**
   * Validates a query object against the schema
   */
  static validate(query: unknown): QueryValidationResult {
    try {
      QuerySchema.parse(query);
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
   * Validates query creation input
   */
  static validateCreate(queryData: unknown): QueryValidationResult {
    try {
      QueryCreateSchema.parse(queryData);
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
   * Validates execution parameters against query parameter schema
   */
  static validateExecutionParams(
    query: Query,
    params: QueryExecutionParams
  ): QueryValidationResult {
    try {
      // Use Zod to validate against the JSON schema in query.parameters
      const schema = this.jsonSchemaToZod(query.parameters);
      schema.parse(params);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `parameter.${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [`Parameter validation failed: ${String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * Creates a new query with generated fields
   */
  static create(queryData: QueryCreate): Query {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      ...queryData,
    };
  }

  /**
   * Updates a query with new data
   */
  static update(existingQuery: Query, updateData: QueryUpdate): Query {
    return {
      ...existingQuery,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Prepares query operation by resolving templates with parameters
   */
  static prepareOperation(
    query: Query,
    params: QueryExecutionParams
  ): PreparedOperation {
    const operation = query.operation;
    const prepared: PreparedOperation = {
      parameters: params,
      headers: operation.headers,
      body: operation.body,
    };

    // Resolve template if present
    if (operation.template) {
      prepared.resolvedTemplate = this.resolveTemplate(operation.template, params);
      prepared.resolvedPath = prepared.resolvedTemplate;
    } else if (operation.path) {
      prepared.resolvedPath = this.resolveTemplate(operation.path, params);
    }

    return prepared;
  }

  /**
   * Resolves template string with parameter values
   */
  private static resolveTemplate(template: string, params: QueryExecutionParams): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      const value = params[paramName];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Basic JSON Schema to Zod conversion (limited implementation)
   */
  private static jsonSchemaToZod(jsonSchema: any): z.ZodType<any> {
    if (jsonSchema.type === 'object') {
      const shape: Record<string, z.ZodType<any>> = {};
      
      if (jsonSchema.properties) {
        for (const [key, prop] of Object.entries(jsonSchema.properties as any)) {
          shape[key] = this.jsonSchemaToZod(prop);
          
          // Handle optional fields
          if (!jsonSchema.required?.includes(key)) {
            shape[key] = shape[key].optional();
          }
        }
      }
      
      return z.object(shape);
    }
    
    if (jsonSchema.type === 'string') {
      let schema = z.string();
      if (jsonSchema.minLength) schema = schema.min(jsonSchema.minLength);
      if (jsonSchema.maxLength) schema = schema.max(jsonSchema.maxLength);
      if (jsonSchema.pattern) schema = schema.regex(new RegExp(jsonSchema.pattern));
      if (jsonSchema.enum) schema = z.enum(jsonSchema.enum);
      return schema;
    }
    
    if (jsonSchema.type === 'number') {
      let schema = z.number();
      if (jsonSchema.minimum !== undefined) schema = schema.min(jsonSchema.minimum);
      if (jsonSchema.maximum !== undefined) schema = schema.max(jsonSchema.maximum);
      return schema;
    }
    
    if (jsonSchema.type === 'integer') {
      let schema = z.number().int();
      if (jsonSchema.minimum !== undefined) schema = schema.min(jsonSchema.minimum);
      if (jsonSchema.maximum !== undefined) schema = schema.max(jsonSchema.maximum);
      return schema;
    }
    
    if (jsonSchema.type === 'boolean') {
      return z.boolean();
    }
    
    if (jsonSchema.type === 'array') {
      const itemSchema = jsonSchema.items ? this.jsonSchemaToZod(jsonSchema.items) : z.any();
      let schema = z.array(itemSchema);
      if (jsonSchema.minItems !== undefined) schema = schema.min(jsonSchema.minItems);
      if (jsonSchema.maxItems !== undefined) schema = schema.max(jsonSchema.maxItems);
      return schema;
    }
    
    // Default to any for unsupported types
    return z.any();
  }

  /**
   * Checks if query schema is compatible with another version
   */
  static isSchemaCompatible(query1: Query, query2: Query): boolean {
    const version1Parts = query1.schemaVersion.split('.').map(Number);
    const version2Parts = query2.schemaVersion.split('.').map(Number);

    // Same major version is considered compatible
    return version1Parts[0] === version2Parts[0];
  }

  /**
   * Converts database row to Query object
   */
  static fromDatabase(row: any): Query {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      toolId: row.tool_id,
      schemaVersion: row.schema_version,
      parameters: JSON.parse(row.parameters),
      operation: JSON.parse(row.operation),
      outputSchema: row.output_schema ? JSON.parse(row.output_schema) : undefined,
      caching: row.caching ? JSON.parse(row.caching) : undefined,
      timeout: row.timeout || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined,
      executionCount: row.execution_count,
      lastExecuted: row.last_executed || undefined,
    };
  }

  /**
   * Converts Query object to database row format
   */
  static toDatabase(query: Query): Record<string, any> {
    return {
      id: query.id,
      name: query.name,
      description: query.description || null,
      tool_id: query.toolId,
      schema_version: query.schemaVersion,
      parameters: JSON.stringify(query.parameters),
      operation: JSON.stringify(query.operation),
      output_schema: query.outputSchema ? JSON.stringify(query.outputSchema) : null,
      caching: query.caching ? JSON.stringify(query.caching) : null,
      timeout: query.timeout || null,
      created_at: query.createdAt,
      updated_at: query.updatedAt || null,
      execution_count: query.executionCount,
      last_executed: query.lastExecuted || null,
    };
  }

  /**
   * Generates cache key for query result
   */
  static generateCacheKey(query: Query, params: QueryExecutionParams): string {
    if (query.caching?.key) {
      return this.resolveTemplate(query.caching.key, params);
    }
    
    // Default cache key: queryId + hash of parameters
    const paramsHash = this.hashObject(params);
    return `${query.id}:${paramsHash}`;
  }

  /**
   * Simple object hash function
   */
  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}