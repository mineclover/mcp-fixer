/**
 * Fixed Interface Manager
 * 
 * Core service for managing fixed interface registrations, validation, and execution.
 * Provides high-performance cached access to MCP tool operations.
 */

import { Database } from 'bun:sqlite';
import { 
  FixedInterface, 
  FixedInterfaceCreate, 
  FixedInterfaceUpdate,
  FixedInterfaceModel,
  InterfaceValidationResult,
  InterfaceExecutionParams,
  InterfaceExecutionResult,
  FixedInterfaceListFilters,
  FixedInterfaceStats,
  PerformanceMetric,
  PerformanceMetricModel,
  Tool,
  ToolModel
} from '../../models/index.js';
import Ajv, { type ValidateFunction } from 'ajv';

export interface InterfaceManagerConfig {
  database: Database;
  cacheTimeout: number; // seconds
  validationInterval: number; // seconds
  performanceTarget: number; // milliseconds
  enableMetrics: boolean;
}

export interface RegistrationOptions {
  force?: boolean;
  validateTool?: boolean;
  autoDiscover?: boolean;
  dryRun?: boolean;
}

export interface ExecutionOptions {
  timeout?: number;
  validateResponse?: boolean;
  recordMetrics?: boolean;
  retryAttempts?: number;
}

export class FixedInterfaceManager {
  private db: Database;
  private ajv: InstanceType<typeof Ajv>;
  private cache: Map<string, FixedInterface>;
  private validationCache: Map<string, InterfaceValidationResult>;
  private config: InterfaceManagerConfig;
  private lastCacheUpdate: number = 0;

  constructor(config: InterfaceManagerConfig) {
    this.db = config.database;
    this.config = config;
    this.ajv = new Ajv({ allErrors: true });
    this.cache = new Map();
    this.validationCache = new Map();
    
    this.initializeDatabase();
    this.loadInterfacesIntoCache();
  }

  /**
   * Register a new fixed interface
   */
  async registerInterface(
    interfaceData: FixedInterfaceCreate,
    options: RegistrationOptions = {}
  ): Promise<FixedInterface> {
    // Validate tool exists if requested
    if (options.validateTool) {
      await this.validateToolExists(interfaceData.toolId);
    }

    // Auto-discover schema from MCP tool if requested
    if (options.autoDiscover) {
      const discoveredSchema = await this.discoverInterfaceSchema(
        interfaceData.toolId,
        interfaceData.name
      );
      interfaceData.schemaJson = discoveredSchema.schema;
      interfaceData.parametersJson = discoveredSchema.parameters;
      interfaceData.responseSchemaJson = discoveredSchema.responseSchema;
    }

    // Check for existing interface
    const existingInterface = await this.findInterfaceByName(
      interfaceData.toolId,
      interfaceData.name
    );

    if (existingInterface && !options.force) {
      throw new Error(`Interface '${interfaceData.name}' already exists for tool '${interfaceData.toolId}'`);
    }

    // Validate interface data
    const validation = FixedInterfaceModel.validate(interfaceData);
    if (!validation.valid) {
      throw new Error(`Interface validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate JSON schemas
    await this.validateSchemas(interfaceData);

    if (options.dryRun) {
      return FixedInterfaceModel.create(interfaceData);
    }

    let fixedInterface: FixedInterface;

    if (existingInterface && options.force) {
      // Update existing interface
      const updateData: FixedInterfaceUpdate = {
        displayName: interfaceData.displayName,
        description: interfaceData.description,
        schemaJson: interfaceData.schemaJson,
        parametersJson: interfaceData.parametersJson,
        responseSchemaJson: interfaceData.responseSchemaJson,
        version: interfaceData.version,
        isActive: interfaceData.isActive,
      };
      
      fixedInterface = await this.updateInterface(existingInterface.id, updateData);
    } else {
      // Create new interface
      fixedInterface = FixedInterfaceModel.create(interfaceData);
      
      const stmt = this.db.prepare(`
        INSERT INTO fixed_interfaces (
          id, tool_id, name, display_name, description, 
          schema_json, parameters_json, response_schema_json, 
          version, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        fixedInterface.id,
        fixedInterface.toolId,
        fixedInterface.name,
        fixedInterface.displayName,
        fixedInterface.description || null,
        JSON.stringify(fixedInterface.schemaJson),
        JSON.stringify(fixedInterface.parametersJson),
        JSON.stringify(fixedInterface.responseSchemaJson),
        fixedInterface.version,
        fixedInterface.isActive ? 1 : 0,
        fixedInterface.createdAt
      );
    }

    // Update cache
    this.cache.set(fixedInterface.id, fixedInterface);
    this.invalidateValidationCache(fixedInterface.id);

    return fixedInterface;
  }

  /**
   * List fixed interfaces with filtering and sorting
   */
  async listInterfaces(
    toolId?: string,
    filters: FixedInterfaceListFilters = {}
  ): Promise<FixedInterface[]> {
    let query = `
      SELECT * FROM fixed_interfaces 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Add filters
    if (toolId) {
      query += ` AND tool_id = ?`;
      params.push(toolId);
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = ?`;
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters.name) {
      query += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }

    if (filters.version) {
      query += ` AND version = ?`;
      params.push(filters.version);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => FixedInterfaceModel.fromDatabase(row));
  }

  /**
   * Get interface by ID with caching
   */
  async getInterface(interfaceId: string): Promise<FixedInterface | null> {
    // Check cache first
    if (this.cache.has(interfaceId)) {
      return this.cache.get(interfaceId)!;
    }

    const stmt = this.db.prepare(`
      SELECT * FROM fixed_interfaces WHERE id = ?
    `);
    
    const row = stmt.get(interfaceId) as any;
    if (!row) {
      return null;
    }

    const fixedInterface = FixedInterfaceModel.fromDatabase(row);
    this.cache.set(interfaceId, fixedInterface);
    
    return fixedInterface;
  }

  /**
   * Execute fixed interface with performance tracking
   */
  async executeInterface(
    interfaceId: string,
    parameters: Record<string, any>,
    options: ExecutionOptions = {}
  ): Promise<InterfaceExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Get interface
      const fixedInterface = await this.getInterface(interfaceId);
      if (!fixedInterface) {
        throw new Error(`Fixed interface not found: ${interfaceId}`);
      }

      // Check if interface is active
      if (!fixedInterface.isActive && !options.retryAttempts) {
        throw new Error(`Interface '${fixedInterface.name}' is inactive`);
      }

      // Validate parameters
      const paramValidation = this.validateParameters(fixedInterface, parameters);
      if (!paramValidation.valid) {
        throw new Error(`Parameter validation failed: ${paramValidation.errors.join(', ')}`);
      }

      // Get tool information
      const tool = await this.getToolForInterface(fixedInterface.toolId);
      if (!tool) {
        throw new Error(`Tool not found: ${fixedInterface.toolId}`);
      }

      // Execute operation via MCP
      const executionResult = await this.executeMCPOperation(
        tool,
        fixedInterface,
        parameters,
        options
      );

      // Validate response if requested
      let validationResult: InterfaceValidationResult | undefined;
      if (options.validateResponse && executionResult.success) {
        validationResult = this.validateResponse(fixedInterface, executionResult.data);
      }

      const responseTime = Date.now() - startTime;

      // Record performance metrics
      if (options.recordMetrics !== false && this.config.enableMetrics) {
        await this.recordPerformanceMetric(
          fixedInterface,
          responseTime,
          executionResult.success,
          executionResult.error
        );
      }

      return {
        success: executionResult.success,
        data: executionResult.data,
        error: executionResult.error,
        responseTime,
        validationResult,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record failed execution metrics
      if (options.recordMetrics !== false && this.config.enableMetrics) {
        const fixedInterface = await this.getInterface(interfaceId);
        if (fixedInterface) {
          await this.recordPerformanceMetric(
            fixedInterface,
            responseTime,
            false,
            errorMessage
          );
        }
      }

      return {
        success: false,
        error: errorMessage,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate interface against current tool schema
   */
  async validateInterface(interfaceId: string): Promise<InterfaceValidationResult> {
    // Check cache first
    const cacheKey = `${interfaceId}_${Date.now()}`;
    if (this.validationCache.has(interfaceId)) {
      const cached = this.validationCache.get(interfaceId)!;
      // Return cached result if less than validation interval
      const cacheAge = Date.now() - this.lastCacheUpdate;
      if (cacheAge < this.config.validationInterval * 1000) {
        return cached;
      }
    }

    const fixedInterface = await this.getInterface(interfaceId);
    if (!fixedInterface) {
      return {
        valid: false,
        errors: ['Interface not found'],
        warnings: [],
        schemaValid: false,
        parametersValid: false,
        responseSchemaValid: false,
      };
    }

    // Validate schemas
    const result = FixedInterfaceModel.validate(fixedInterface);
    
    // Additional validation against live tool
    try {
      await this.validateAgainstTool(fixedInterface);
    } catch (error) {
      result.errors.push(`Tool validation failed: ${error}`);
      result.valid = false;
    }

    // Cache result
    this.validationCache.set(interfaceId, result);
    
    // Update last validated timestamp
    if (result.valid) {
      await this.updateLastValidated(interfaceId);
    }

    return result;
  }

  /**
   * Update interface
   */
  async updateInterface(
    interfaceId: string,
    updateData: FixedInterfaceUpdate
  ): Promise<FixedInterface> {
    const existingInterface = await this.getInterface(interfaceId);
    if (!existingInterface) {
      throw new Error(`Interface not found: ${interfaceId}`);
    }

    const updatedInterface = FixedInterfaceModel.update(existingInterface, updateData);
    
    // Validate updated interface
    const validation = FixedInterfaceModel.validate(updatedInterface);
    if (!validation.valid) {
      throw new Error(`Interface validation failed: ${validation.errors.join(', ')}`);
    }

    // Update database
    const stmt = this.db.prepare(`
      UPDATE fixed_interfaces SET
        display_name = ?, description = ?, schema_json = ?,
        parameters_json = ?, response_schema_json = ?, version = ?, is_active = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedInterface.displayName,
      updatedInterface.description || null,
      JSON.stringify(updatedInterface.schemaJson),
      JSON.stringify(updatedInterface.parametersJson),
      JSON.stringify(updatedInterface.responseSchemaJson),
      updatedInterface.version,
      updatedInterface.isActive ? 1 : 0,
      interfaceId
    );

    // Update cache
    this.cache.set(interfaceId, updatedInterface);
    this.invalidateValidationCache(interfaceId);

    return updatedInterface;
  }

  /**
   * Delete interface
   */
  async deleteInterface(interfaceId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM fixed_interfaces WHERE id = ?`);
    stmt.run(interfaceId);

    // Remove from cache
    this.cache.delete(interfaceId);
    this.invalidateValidationCache(interfaceId);
  }

  /**
   * Get interface statistics
   */
  async getInterfaceStats(
    toolId?: string,
    timeRangeHours: number = 24
  ): Promise<FixedInterfaceStats> {
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

    // Get basic counts
    let countQuery = `SELECT COUNT(*) as total FROM fixed_interfaces WHERE 1=1`;
    let activeQuery = `SELECT COUNT(*) as active FROM fixed_interfaces WHERE is_active = 1`;
    
    const params: any[] = [];
    if (toolId) {
      countQuery += ` AND tool_id = ?`;
      activeQuery += ` AND tool_id = ?`;
      params.push(toolId);
    }

    const totalResult = this.db.prepare(countQuery).get(...params) as any;
    const activeResult = this.db.prepare(activeQuery).get(...params) as any;

    // Get performance metrics
    let perfQuery = `
      SELECT 
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) as total_executions,
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate
      FROM performance_metrics pm
      JOIN fixed_interfaces fi ON pm.interface_id = fi.id
      WHERE pm.timestamp >= ? AND pm.access_type = 'fixed'
    `;
    
    const perfParams = [since];
    if (toolId) {
      perfQuery += ` AND fi.tool_id = ?`;
      perfParams.push(toolId);
    }

    const perfResult = this.db.prepare(perfQuery).get(...perfParams) as any;

    return {
      totalInterfaces: totalResult.total || 0,
      activeInterfaces: activeResult.active || 0,
      inactiveInterfaces: (totalResult.total || 0) - (activeResult.active || 0),
      validInterfaces: 0, // Would need validation status tracking
      invalidInterfaces: 0,
      averageResponseTime: perfResult.avg_response_time || 0,
      totalExecutions: perfResult.total_executions || 0,
      successRate: perfResult.success_rate || 0,
    };
  }

  // Private helper methods

  private initializeDatabase(): void {
    // Ensure database schema is current
    const stmt = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='fixed_interfaces'
    `);
    
    if (!stmt.get()) {
      throw new Error('Fixed interfaces table not found. Please run database migration.');
    }
  }

  private loadInterfacesIntoCache(): void {
    const stmt = this.db.prepare(`SELECT * FROM fixed_interfaces WHERE is_active = 1`);
    const rows = stmt.all() as any[];
    
    for (const row of rows) {
      const fixedInterface = FixedInterfaceModel.fromDatabase(row);
      this.cache.set(fixedInterface.id, fixedInterface);
    }

    this.lastCacheUpdate = Date.now();
  }

  private async validateToolExists(toolId: string): Promise<void> {
    const stmt = this.db.prepare(`SELECT id FROM tools WHERE id = ?`);
    const tool = stmt.get(toolId);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }
  }

  private async discoverInterfaceSchema(
    toolId: string,
    operationName: string
  ): Promise<{
    schema: any;
    parameters: any;
    responseSchema: any;
  }> {
    // This would integrate with MCP tool discovery
    // For now, return basic schema structure
    return {
      schema: {
        type: 'object',
        properties: {
          operation: { type: 'string', const: operationName }
        }
      },
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      responseSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' }
        }
      }
    };
  }

  private async findInterfaceByName(
    toolId: string,
    name: string
  ): Promise<FixedInterface | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM fixed_interfaces 
      WHERE tool_id = ? AND name = ?
    `);
    
    const row = stmt.get(toolId, name) as any;
    return row ? FixedInterfaceModel.fromDatabase(row) : null;
  }

  private async validateSchemas(interfaceData: FixedInterfaceCreate): Promise<void> {
    try {
      // Validate JSON schema structure
      this.ajv.compile(interfaceData.schemaJson);
      this.ajv.compile(interfaceData.parametersJson);
      this.ajv.compile(interfaceData.responseSchemaJson);
    } catch (error) {
      throw new Error(`Schema validation failed: ${error}`);
    }
  }

  private validateParameters(
    fixedInterface: FixedInterface,
    parameters: Record<string, any>
  ): InterfaceValidationResult {
    try {
      const validate = this.ajv.compile(fixedInterface.parametersJson);
      const valid = validate(parameters) as boolean;
      
      return {
        valid,
        errors: validate.errors ? validate.errors.map(e => e.message || '') : [],
        warnings: [],
        schemaValid: true,
        parametersValid: valid,
        responseSchemaValid: true,
      };
    } catch (error) {
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

  private validateResponse(
    fixedInterface: FixedInterface,
    responseData: any
  ): InterfaceValidationResult {
    try {
      const validate = this.ajv.compile(fixedInterface.responseSchemaJson);
      const valid = validate(responseData) as boolean;
      
      return {
        valid,
        errors: validate.errors ? validate.errors.map(e => e.message || '') : [],
        warnings: [],
        schemaValid: true,
        parametersValid: true,
        responseSchemaValid: valid,
      };
    } catch (error) {
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

  private async getToolForInterface(toolId: string): Promise<Tool | null> {
    const stmt = this.db.prepare(`SELECT * FROM tools WHERE id = ?`);
    const row = stmt.get(toolId) as any;
    
    return row ? ToolModel.fromDatabase(row) : null;
  }

  private async executeMCPOperation(
    tool: Tool,
    fixedInterface: FixedInterface,
    parameters: Record<string, any>,
    options: ExecutionOptions
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // This would integrate with the actual MCP client
    // For now, simulate execution
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        data: {
          operation: fixedInterface.name,
          result: 'simulated response data',
          timestamp: new Date().toISOString(),
        }
      };
    } else {
      return {
        success: false,
        error: 'Simulated MCP operation failure'
      };
    }
  }

  private async recordPerformanceMetric(
    fixedInterface: FixedInterface,
    responseTime: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const metric = PerformanceMetricModel.recordOperation(
      fixedInterface.toolId,
      fixedInterface.name,
      'fixed',
      responseTime,
      success,
      fixedInterface.id,
      error ? { message: error, category: 'server' } : undefined
    );

    const stmt = this.db.prepare(`
      INSERT INTO performance_metrics (
        id, interface_id, tool_id, access_type, operation_name,
        response_time_ms, success, error_details,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metric.id,
      metric.interfaceId || null,
      metric.toolId,
      metric.accessType,
      metric.operationName,
      metric.responseTimeMs,
      metric.success ? 1 : 0,
      metric.errorMessage || null,
      metric.timestamp
    );
  }

  private async validateAgainstTool(fixedInterface: FixedInterface): Promise<void> {
    // This would validate the interface against the actual MCP tool
    // Check if operation exists, parameters are correct, etc.
    // For now, assume validation passes
  }

  private async updateLastValidated(interfaceId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE fixed_interfaces 
      SET last_validated = ? 
      WHERE id = ?
    `);
    
    stmt.run(new Date().toISOString(), interfaceId);
  }

  private invalidateValidationCache(interfaceId: string): void {
    this.validationCache.delete(interfaceId);
  }
}