import { z } from 'zod';
import { existsSync, statSync } from 'fs';

// Collector status
export const CollectorStatus = z.enum(['enabled', 'disabled', 'error']);
export type CollectorStatusType = z.infer<typeof CollectorStatus>;

// Collector execution context
export const CollectorContextSchema = z.object({
  collectorId: z.string().uuid(),
  executionId: z.string().uuid(),
  input: z.record(z.string(), z.any()),
  timeout: z.number().int().positive(),
  environment: z.record(z.string(), z.string()).optional(),
});
export type CollectorContext = z.infer<typeof CollectorContextSchema>;

// Collector execution result
export const CollectorExecutionResultSchema = z.object({
  executionId: z.string().uuid(),
  collectorId: z.string().uuid(),
  success: z.boolean(),
  output: z.any().optional(),
  error: z.string().optional(),
  duration: z.number(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});
export type CollectorExecutionResult = z.infer<typeof CollectorExecutionResultSchema>;

// Collector schema definition
export const CollectorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  filePath: z.string().min(1),
  inputSchema: z.record(z.string(), z.any()), // JSON Schema for input
  outputSchema: z.record(z.string(), z.any()), // JSON Schema for output
  timeout: z.number().int().positive().default(30),
  enabled: z.boolean().default(true),
  version: z.string().default('1.0.0'),
  dependencies: z.array(z.string()).default([]),
  environment: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().datetime(),
  lastExecuted: z.string().datetime().optional(),
  executionCount: z.number().int().min(0).default(0),
});

export type Collector = z.infer<typeof CollectorSchema>;

// Collector creation input
export const CollectorCreateSchema = CollectorSchema.omit({
  id: true,
  createdAt: true,
  lastExecuted: true,
  executionCount: true,
});
export type CollectorCreate = z.infer<typeof CollectorCreateSchema>;

// Collector update input
export const CollectorUpdateSchema = CollectorSchema.partial().omit({
  id: true,
  createdAt: true,
  executionCount: true,
});
export type CollectorUpdate = z.infer<typeof CollectorUpdateSchema>;

// Collector module interface (what the loaded module should export)
export const CollectorModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  inputSchema: z.record(z.string(), z.any()),
  outputSchema: z.record(z.string(), z.any()),
  dependencies: z.array(z.string()).default([]),
  timeout: z.number().int().positive().default(30),
  collect: z.function()
    .args(z.any(), z.any().optional()) // (input, context?)
    .returns(z.promise(z.any())),
});
export type CollectorModule = z.infer<typeof CollectorModuleSchema>;

// Collector validation result
export const CollectorValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type CollectorValidationResult = z.infer<typeof CollectorValidationResultSchema>;

// Collector list filters
export const CollectorListFiltersSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  lastExecutedAfter: z.string().datetime().optional(),
}).partial();
export type CollectorListFilters = z.infer<typeof CollectorListFiltersSchema>;

// Collector statistics
export const CollectorStatsSchema = z.object({
  totalCollectors: z.number(),
  enabledCollectors: z.number(),
  disabledCollectors: z.number(),
  totalExecutions: z.number(),
  averageExecutionTime: z.number().optional(),
  successRate: z.number().optional(),
});
export type CollectorStats = z.infer<typeof CollectorStatsSchema>;

// Collector chain execution result
export const CollectorChainResultSchema = z.object({
  executionId: z.string().uuid(),
  results: z.array(CollectorExecutionResultSchema),
  success: z.boolean(),
  duration: z.number(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});
export type CollectorChainResult = z.infer<typeof CollectorChainResultSchema>;

// Utility functions for collector model
export class CollectorModel {
  /**
   * Validates a collector object against the schema
   */
  static validate(collector: unknown): CollectorValidationResult {
    try {
      CollectorSchema.parse(collector);
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
   * Validates collector creation input
   */
  static validateCreate(collectorData: unknown): CollectorValidationResult {
    try {
      CollectorCreateSchema.parse(collectorData);
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
   * Validates collector module structure
   */
  static async validateModule(filePath: string): Promise<CollectorValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        valid: false,
        errors: [`Collector file does not exist: ${filePath}`],
        warnings: [],
      };
    }

    // Check file permissions
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        errors.push(`Path is not a file: ${filePath}`);
      }
    } catch (error) {
      errors.push(`Cannot access file: ${filePath} - ${String(error)}`);
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Try to load and validate module
    try {
      delete require.cache[require.resolve(filePath)];
      const module = require(filePath);

      // Validate module structure
      const validationResult = CollectorModuleSchema.safeParse(module);
      if (!validationResult.success) {
        return {
          valid: false,
          errors: validationResult.error.errors.map(e => 
            `Module ${e.path.join('.')}: ${e.message}`
          ),
          warnings,
        };
      }

      // Additional validation checks
      const collectorModule = validationResult.data;

      // Check for required methods
      if (typeof collectorModule.collect !== 'function') {
        errors.push('Module must export a "collect" function');
      }

      // Validate schemas
      if (!collectorModule.inputSchema || typeof collectorModule.inputSchema !== 'object') {
        errors.push('Module must export a valid "inputSchema" object');
      }

      if (!collectorModule.outputSchema || typeof collectorModule.outputSchema !== 'object') {
        errors.push('Module must export a valid "outputSchema" object');
      }

      // Check for potential issues
      if (collectorModule.timeout && collectorModule.timeout > 300) {
        warnings.push('Timeout is very high (>5 minutes), consider reducing it');
      }

      if (collectorModule.dependencies && collectorModule.dependencies.length > 10) {
        warnings.push('Many dependencies detected, verify they are all necessary');
      }

    } catch (error) {
      errors.push(`Failed to load module: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates input against collector's input schema
   */
  static validateInput(collector: Collector, input: any): CollectorValidationResult {
    try {
      // Use the same JSON Schema to Zod conversion as Query model
      const schema = this.jsonSchemaToZod(collector.inputSchema);
      schema.parse(input);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `input.${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [`Input validation failed: ${String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * Validates output against collector's output schema
   */
  static validateOutput(collector: Collector, output: any): CollectorValidationResult {
    try {
      const schema = this.jsonSchemaToZod(collector.outputSchema);
      schema.parse(output);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `output.${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [`Output validation failed: ${String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * Creates a new collector with generated fields
   */
  static create(collectorData: CollectorCreate): Collector {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      executionCount: 0,
      ...collectorData,
    };
  }

  /**
   * Updates a collector with new data
   */
  static update(existingCollector: Collector, updateData: CollectorUpdate): Collector {
    return {
      ...existingCollector,
      ...updateData,
    };
  }

  /**
   * Loads collector module from file system
   */
  static async loadModule(filePath: string): Promise<CollectorModule> {
    try {
      // Clear require cache to get fresh module
      delete require.cache[require.resolve(filePath)];
      const module = require(filePath);
      
      const validationResult = CollectorModuleSchema.safeParse(module);
      if (!validationResult.success) {
        throw new Error(`Invalid collector module: ${validationResult.error.message}`);
      }
      
      return validationResult.data;
    } catch (error) {
      throw new Error(`Failed to load collector module: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates collector from loaded module
   */
  static fromModule(filePath: string, module: CollectorModule): CollectorCreate {
    return {
      name: module.name,
      description: module.description,
      filePath,
      inputSchema: module.inputSchema,
      outputSchema: module.outputSchema,
      timeout: module.timeout,
      version: module.version,
      dependencies: module.dependencies,
    };
  }

  /**
   * Checks if collector dependencies are satisfied
   */
  static checkDependencies(collector: Collector, availableCollectors: Collector[]): CollectorValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!collector.dependencies || collector.dependencies.length === 0) {
      return { valid: true, errors: [], warnings: [] };
    }

    const availableNames = new Set(availableCollectors.map(c => c.name));

    for (const dependency of collector.dependencies) {
      if (!availableNames.has(dependency)) {
        errors.push(`Missing dependency: ${dependency}`);
      }
    }

    // Check for circular dependencies (simplified check)
    const hasCircularDep = collector.dependencies.some(dep => {
      const depCollector = availableCollectors.find(c => c.name === dep);
      return depCollector?.dependencies?.includes(collector.name);
    });

    if (hasCircularDep) {
      warnings.push('Potential circular dependency detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Resolves execution order for collector chain
   */
  static resolveExecutionOrder(collectors: Collector[]): Collector[] {
    const result: Collector[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    function visit(collector: Collector): void {
      if (visiting.has(collector.name)) {
        throw new Error(`Circular dependency detected: ${collector.name}`);
      }
      
      if (visited.has(collector.name)) {
        return;
      }

      visiting.add(collector.name);

      // Visit dependencies first
      for (const depName of collector.dependencies) {
        const depCollector = collectors.find(c => c.name === depName);
        if (depCollector) {
          visit(depCollector);
        }
      }

      visiting.delete(collector.name);
      visited.add(collector.name);
      result.push(collector);
    }

    for (const collector of collectors) {
      if (!visited.has(collector.name)) {
        visit(collector);
      }
    }

    return result;
  }

  /**
   * Basic JSON Schema to Zod conversion (reused from Query model)
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
   * Converts database row to Collector object
   */
  static fromDatabase(row: any): Collector {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      filePath: row.file_path,
      inputSchema: JSON.parse(row.input_schema),
      outputSchema: JSON.parse(row.output_schema),
      timeout: row.timeout,
      enabled: Boolean(row.enabled),
      version: row.version,
      dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
      environment: row.environment ? JSON.parse(row.environment) : undefined,
      createdAt: row.created_at,
      lastExecuted: row.last_executed || undefined,
      executionCount: row.execution_count,
    };
  }

  /**
   * Converts Collector object to database row format
   */
  static toDatabase(collector: Collector): Record<string, any> {
    return {
      id: collector.id,
      name: collector.name,
      description: collector.description || null,
      file_path: collector.filePath,
      input_schema: JSON.stringify(collector.inputSchema),
      output_schema: JSON.stringify(collector.outputSchema),
      timeout: collector.timeout,
      enabled: collector.enabled ? 1 : 0,
      version: collector.version,
      dependencies: JSON.stringify(collector.dependencies),
      environment: collector.environment ? JSON.stringify(collector.environment) : null,
      created_at: collector.createdAt,
      last_executed: collector.lastExecuted || null,
      execution_count: collector.executionCount,
    };
  }

  /**
   * Creates execution context for collector
   */
  static createContext(
    collector: Collector, 
    input: any, 
    executionId: string
  ): CollectorContext {
    return {
      collectorId: collector.id,
      executionId,
      input,
      timeout: collector.timeout,
      environment: collector.environment,
    };
  }
}