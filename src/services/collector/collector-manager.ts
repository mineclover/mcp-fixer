import { z } from 'zod';
import { existsSync, statSync, readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { spawn } from 'child_process';
import { Collector, CollectorModel, CollectorCreate } from '../../models/collector.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';

// Collector execution options
const CollectorExecutionOptionsSchema = z.object({
  timeout: z.number().positive().default(30000),
  validateInput: z.boolean().default(true),
  validateOutput: z.boolean().default(true),
  captureOutput: z.boolean().default(true),
  workingDirectory: z.string().optional(),
});

export type CollectorExecutionOptions = z.infer<typeof CollectorExecutionOptionsSchema>;

// Collector execution result
const CollectorExecutionResultSchema = z.object({
  collectorId: z.string().uuid(),
  executionTime: z.number(),
  output: z.any(),
  status: z.enum(['success', 'error', 'timeout']),
  error: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().optional(),
});

export type CollectorExecutionResult = z.infer<typeof CollectorExecutionResultSchema>;

// Collector validation result
const CollectorValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  metadata: z.object({
    type: z.enum(['node', 'python', 'shell', 'executable']),
    hasInputSchema: z.boolean(),
    hasOutputSchema: z.boolean(),
    hasMetadata: z.boolean(),
  }).optional(),
});

export type CollectorValidationResult = z.infer<typeof CollectorValidationResultSchema>;

export class CollectorManager {
  private db: DatabaseManager;
  private config: ConfigManager;
  private activeExecutions: Map<string, { process: any; abortController: AbortController }> = new Map();

  constructor(db: DatabaseManager, config: ConfigManager) {
    this.db = db;
    this.config = config;
  }

  /**
   * Register a new data collector
   */
  async registerCollector(
    filePath: string,
    name: string,
    description?: string,
    timeout = 30
  ): Promise<Collector> {
    try {
      // Resolve and validate file path
      const resolvedPath = resolve(filePath);
      if (!existsSync(resolvedPath)) {
        throw new Error(`Collector file not found: ${resolvedPath}`);
      }

      // Validate collector file
      const validation = await this.validateCollectorFile(resolvedPath);
      if (!validation.valid) {
        throw new Error(`Collector validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if collector name already exists
      const existing = this.db.prepare('SELECT id FROM collectors WHERE name = ?').get(name);
      if (existing) {
        throw new Error(`Collector with name '${name}' already exists`);
      }

      // Extract schemas from collector file
      const schemas = await this.extractCollectorSchemas(resolvedPath);

      // Create collector record
      const collectorData: CollectorCreate = {
        name,
        description,
        filePath: resolvedPath,
        inputSchema: JSON.stringify(schemas.inputSchema),
        outputSchema: JSON.stringify(schemas.outputSchema),
        timeout,
        enabled: true,
        version: schemas.version || '1.0.0',
      };

      const collector = CollectorModel.create(collectorData);
      const dbData = CollectorModel.toDatabase(collector);

      const stmt = this.db.prepare(`
        INSERT INTO collectors (
          id, name, description, file_path, input_schema, output_schema,
          timeout, enabled, version, created_at, last_executed, execution_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        dbData.id, dbData.name, dbData.description, dbData.file_path,
        dbData.input_schema, dbData.output_schema, dbData.timeout,
        dbData.enabled ? 1 : 0, dbData.version, dbData.created_at,
        dbData.last_executed, dbData.execution_count
      );

      return collector;

    } catch (error) {
      throw new Error(`Failed to register collector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get collector by ID or name
   */
  async getCollector(identifier: string): Promise<Collector | null> {
    try {
      let row: any = null;

      // Try by ID first (UUID format)
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        row = this.db.prepare('SELECT * FROM collectors WHERE id = ?').get(identifier);
      } else {
        // Try by name
        row = this.db.prepare('SELECT * FROM collectors WHERE name = ?').get(identifier);
      }

      return row ? CollectorModel.fromDatabase(row) : null;

    } catch (error) {
      throw new Error(`Failed to get collector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all collectors with optional filters
   */
  async listCollectors(enabledOnly = false): Promise<Collector[]> {
    try {
      let query = 'SELECT * FROM collectors';
      const params: any[] = [];

      if (enabledOnly) {
        query += ' WHERE enabled = ?';
        params.push(1);
      }

      query += ' ORDER BY name';

      const rows = this.db.prepare(query).all(...params) as any[];
      return rows.map(row => CollectorModel.fromDatabase(row));

    } catch (error) {
      throw new Error(`Failed to list collectors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a data collector with input parameters
   */
  async executeCollector(
    identifier: string,
    input: Record<string, any> = {},
    options: Partial<CollectorExecutionOptions> = {}
  ): Promise<CollectorExecutionResult> {
    const opts = CollectorExecutionOptionsSchema.parse(options);
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Get collector
      const collector = await this.getCollector(identifier);
      if (!collector) {
        throw new Error(`Collector '${identifier}' not found`);
      }

      if (!collector.enabled) {
        throw new Error(`Collector '${collector.name}' is disabled`);
      }

      // Validate file still exists
      if (!existsSync(collector.filePath)) {
        throw new Error(`Collector file not found: ${collector.filePath}`);
      }

      // Validate input if requested
      if (opts.validateInput) {
        const inputValidation = this.validateCollectorInput(collector, input);
        if (!inputValidation.valid) {
          throw new Error(`Input validation failed: ${inputValidation.errors.join(', ')}`);
        }
      }

      // Execute collector
      const result = await this.executeCollectorFile(collector, input, opts, executionId);

      // Update execution statistics
      await this.updateCollectorStatistics(collector.id);

      return {
        collectorId: collector.id,
        executionTime: Date.now() - startTime,
        ...result,
      };

    } catch (error) {
      return {
        collectorId: identifier,
        executionTime: Date.now() - startTime,
        output: null,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test a collector with sample input
   */
  async testCollector(identifier: string): Promise<CollectorExecutionResult> {
    try {
      const collector = await this.getCollector(identifier);
      if (!collector) {
        throw new Error(`Collector '${identifier}' not found`);
      }

      // Create sample input based on schema
      const sampleInput = this.generateSampleInput(collector);

      return await this.executeCollector(identifier, sampleInput, {
        timeout: 10000, // Shorter timeout for testing
        validateInput: false,
        validateOutput: false,
      });

    } catch (error) {
      throw new Error(`Failed to test collector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enable or disable a collector
   */
  async setCollectorEnabled(identifier: string, enabled: boolean): Promise<boolean> {
    try {
      const collector = await this.getCollector(identifier);
      if (!collector) {
        return false;
      }

      const stmt = this.db.prepare('UPDATE collectors SET enabled = ? WHERE id = ?');
      const result = stmt.run(enabled ? 1 : 0, collector.id);

      return result.changes > 0;

    } catch (error) {
      throw new Error(`Failed to update collector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a collector
   */
  async removeCollector(identifier: string): Promise<boolean> {
    try {
      const collector = await this.getCollector(identifier);
      if (!collector) {
        return false;
      }

      const stmt = this.db.prepare('DELETE FROM collectors WHERE id = ?');
      const result = stmt.run(collector.id);

      return result.changes > 0;

    } catch (error) {
      throw new Error(`Failed to remove collector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get collector statistics
   */
  async getCollectorStats(): Promise<{
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
  }> {
    try {
      const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM collectors').get() as { count: number };
      const enabledResult = this.db.prepare('SELECT COUNT(*) as count FROM collectors WHERE enabled = 1').get() as { count: number };

      const executionStats = this.db.prepare(`
        SELECT 
          SUM(execution_count) as total_executions,
          AVG(execution_count) as avg_executions
        FROM collectors
      `).get() as { total_executions: number; avg_executions: number };

      const topCollectors = this.db.prepare(`
        SELECT id, name, execution_count, last_executed
        FROM collectors
        WHERE execution_count > 0
        ORDER BY execution_count DESC, last_executed DESC
        LIMIT 5
      `).all() as any[];

      return {
        totalCollectors: totalResult.count,
        enabledCollectors: enabledResult.count,
        disabledCollectors: totalResult.count - enabledResult.count,
        totalExecutions: executionStats.total_executions || 0,
        averageExecutionTime: executionStats.avg_executions || 0,
        mostUsedCollectors: topCollectors.map(c => ({
          id: c.id,
          name: c.name,
          executionCount: c.execution_count,
          lastExecuted: c.last_executed || undefined,
        })),
      };

    } catch (error) {
      throw new Error(`Failed to get collector stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private helper methods

  private async validateCollectorFile(filePath: string): Promise<CollectorValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file exists and is readable
      const stat = statSync(filePath);
      if (!stat.isFile()) {
        errors.push('Path is not a file');
        return { valid: false, errors, warnings };
      }

      // Determine collector type based on file extension
      const ext = extname(filePath).toLowerCase();
      let type: 'node' | 'python' | 'shell' | 'executable';

      switch (ext) {
        case '.js':
        case '.ts':
        case '.mjs':
          type = 'node';
          break;
        case '.py':
          type = 'python';
          break;
        case '.sh':
        case '.bash':
          type = 'shell';
          break;
        default:
          type = 'executable';
          // Check if file is executable
          try {
            statSync(filePath);
            // On Unix-like systems, check execute permission
            if (process.platform !== 'win32') {
              const mode = stat.mode;
              if (!(mode & 0o111)) {
                warnings.push('File may not be executable');
              }
            }
          } catch {
            warnings.push('Unable to determine file permissions');
          }
      }

      // Try to read file content for additional validation
      if (type === 'node' || type === 'python') {
        try {
          const content = readFileSync(filePath, 'utf8');
          
          // Check for required metadata
          const hasInputSchema = content.includes('inputSchema') || content.includes('INPUT_SCHEMA');
          const hasOutputSchema = content.includes('outputSchema') || content.includes('OUTPUT_SCHEMA');
          const hasMetadata = content.includes('metadata') || content.includes('METADATA');

          if (!hasInputSchema) {
            warnings.push('No input schema detected');
          }
          if (!hasOutputSchema) {
            warnings.push('No output schema detected');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings,
            metadata: {
              type,
              hasInputSchema,
              hasOutputSchema,
              hasMetadata,
            },
          };

        } catch (readError) {
          warnings.push(`Unable to read file content: ${readError instanceof Error ? readError.message : String(readError)}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          type,
          hasInputSchema: false,
          hasOutputSchema: false,
          hasMetadata: false,
        },
      };

    } catch (error) {
      errors.push(`File validation error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors, warnings };
    }
  }

  private async extractCollectorSchemas(filePath: string): Promise<{
    inputSchema: any;
    outputSchema: any;
    version?: string;
  }> {
    const ext = extname(filePath).toLowerCase();

    // Default schemas
    const defaultInputSchema = {
      type: 'object',
      properties: {},
      additionalProperties: true,
    };

    const defaultOutputSchema = {
      type: 'object',
      additionalProperties: true,
    };

    try {
      if (ext === '.js' || ext === '.mjs') {
        // Try to extract schemas from Node.js module
        const content = readFileSync(filePath, 'utf8');
        
        // Look for exported schemas
        const inputSchemaMatch = content.match(/(?:export\s+const\s+inputSchema|exports\.inputSchema)\s*=\s*(\{[\s\S]*?\});/);
        const outputSchemaMatch = content.match(/(?:export\s+const\s+outputSchema|exports\.outputSchema)\s*=\s*(\{[\s\S]*?\});/);
        const versionMatch = content.match(/(?:export\s+const\s+version|exports\.version)\s*=\s*['"]([^'"]+)['"]/);

        const inputSchema = inputSchemaMatch ? JSON.parse(inputSchemaMatch[1]) : defaultInputSchema;
        const outputSchema = outputSchemaMatch ? JSON.parse(outputSchemaMatch[1]) : defaultOutputSchema;
        const version = versionMatch ? versionMatch[1] : undefined;

        return { inputSchema, outputSchema, version };

      } else if (ext === '.py') {
        // Try to extract schemas from Python file
        const content = readFileSync(filePath, 'utf8');
        
        // Look for schema variables (basic regex matching)
        const inputSchemaMatch = content.match(/INPUT_SCHEMA\s*=\s*(\{[\s\S]*?\})/);
        const outputSchemaMatch = content.match(/OUTPUT_SCHEMA\s*=\s*(\{[\s\S]*?\})/);
        const versionMatch = content.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);

        const inputSchema = inputSchemaMatch ? JSON.parse(inputSchemaMatch[1]) : defaultInputSchema;
        const outputSchema = outputSchemaMatch ? JSON.parse(outputSchemaMatch[1]) : defaultOutputSchema;
        const version = versionMatch ? versionMatch[1] : undefined;

        return { inputSchema, outputSchema, version };
      }

      // For other file types, return default schemas
      return {
        inputSchema: defaultInputSchema,
        outputSchema: defaultOutputSchema,
      };

    } catch (error) {
      // Return defaults if schema extraction fails
      return {
        inputSchema: defaultInputSchema,
        outputSchema: defaultOutputSchema,
      };
    }
  }

  private validateCollectorInput(collector: Collector, input: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    try {
      const inputSchema = JSON.parse(collector.inputSchema);
      const errors: string[] = [];

      // Basic JSON Schema validation (simplified)
      if (inputSchema.type === 'object' && inputSchema.properties) {
        // Check required properties
        if (inputSchema.required && Array.isArray(inputSchema.required)) {
          for (const required of inputSchema.required) {
            if (!(required in input)) {
              errors.push(`Missing required parameter: ${required}`);
            }
          }
        }

        // Check property types (basic validation)
        for (const [key, value] of Object.entries(input)) {
          const propSchema = inputSchema.properties[key];
          if (propSchema && propSchema.type) {
            const actualType = typeof value;
            const expectedType = propSchema.type;

            if (expectedType === 'number' && actualType !== 'number') {
              errors.push(`Parameter '${key}' should be a number`);
            } else if (expectedType === 'string' && actualType !== 'string') {
              errors.push(`Parameter '${key}' should be a string`);
            } else if (expectedType === 'boolean' && actualType !== 'boolean') {
              errors.push(`Parameter '${key}' should be a boolean`);
            } else if (expectedType === 'array' && !Array.isArray(value)) {
              errors.push(`Parameter '${key}' should be an array`);
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  private async executeCollectorFile(
    collector: Collector,
    input: Record<string, any>,
    options: CollectorExecutionOptions,
    executionId: string
  ): Promise<Omit<CollectorExecutionResult, 'collectorId' | 'executionTime'>> {
    const ext = extname(collector.filePath).toLowerCase();
    const abortController = new AbortController();

    try {
      let command: string;
      let args: string[];

      // Determine how to execute the collector
      switch (ext) {
        case '.js':
        case '.mjs':
          command = 'node';
          args = [collector.filePath, JSON.stringify(input)];
          break;
        case '.py':
          command = 'python';
          args = [collector.filePath, JSON.stringify(input)];
          break;
        case '.sh':
        case '.bash':
          command = 'bash';
          args = [collector.filePath, JSON.stringify(input)];
          break;
        default:
          command = collector.filePath;
          args = [JSON.stringify(input)];
      }

      const result = await this.spawnProcess(command, args, {
        timeout: collector.timeout * 1000,
        workingDirectory: options.workingDirectory,
        abortSignal: abortController.signal,
      });

      this.activeExecutions.set(executionId, { 
        process: null, // Process already completed
        abortController 
      });

      // Parse output if it's JSON
      let output = result.stdout;
      try {
        output = JSON.parse(result.stdout);
      } catch {
        // Keep as string if not valid JSON
      }

      return {
        output,
        status: result.exitCode === 0 ? 'success' : 'error',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        error: result.exitCode !== 0 ? result.stderr || `Process exited with code ${result.exitCode}` : undefined,
      };

    } catch (error) {
      return {
        output: null,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private spawnProcess(
    command: string,
    args: string[],
    options: {
      timeout: number;
      workingDirectory?: string;
      abortSignal: AbortSignal;
    }
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: options.workingDirectory,
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        process.kill('SIGTERM');
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 5000);
      }, options.timeout);

      options.abortSignal.addEventListener('abort', () => {
        process.kill('SIGTERM');
      });

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (isTimedOut) {
          reject(new Error('Process timed out'));
        } else {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || 0,
          });
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private generateSampleInput(collector: Collector): Record<string, any> {
    try {
      const inputSchema = JSON.parse(collector.inputSchema);
      const sampleInput: Record<string, any> = {};

      if (inputSchema.type === 'object' && inputSchema.properties) {
        for (const [key, propSchema] of Object.entries(inputSchema.properties as any)) {
          switch (propSchema.type) {
            case 'string':
              sampleInput[key] = propSchema.default || 'sample-string';
              break;
            case 'number':
              sampleInput[key] = propSchema.default || 42;
              break;
            case 'boolean':
              sampleInput[key] = propSchema.default || true;
              break;
            case 'array':
              sampleInput[key] = propSchema.default || [];
              break;
            case 'object':
              sampleInput[key] = propSchema.default || {};
              break;
            default:
              sampleInput[key] = propSchema.default || null;
          }
        }
      }

      return sampleInput;

    } catch (error) {
      return { test: true };
    }
  }

  private async updateCollectorStatistics(collectorId: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE collectors SET 
          execution_count = execution_count + 1,
          last_executed = ?
        WHERE id = ?
      `);

      stmt.run(new Date().toISOString(), collectorId);
    } catch (error) {
      // Don't throw error for statistics update failures
      console.warn('Failed to update collector statistics:', error);
    }
  }
}