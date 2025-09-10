import { z } from 'zod';
import { QueryModel } from '../../models/query.js';
import { ExecutionModel } from '../../models/execution.js';
// Query execution options
const QueryExecutionOptionsSchema = z.object({
    timeout: z.number().positive().default(30000),
    retryAttempts: z.number().min(0).default(0),
    retryDelay: z.number().positive().default(1000),
    validateOutput: z.boolean().default(true),
    saveExecution: z.boolean().default(true),
});
// Query search filters
const QuerySearchFiltersSchema = z.object({
    toolId: z.string().uuid().optional(),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    lastExecutedAfter: z.string().datetime().optional(),
    hasBeenExecuted: z.boolean().optional(),
}).partial();
// Query execution result
const QueryExecutionResultSchema = z.object({
    executionId: z.string().uuid(),
    queryId: z.string().uuid(),
    status: z.enum(['completed', 'failed', 'timeout', 'cancelled']),
    result: z.any().optional(),
    error: z.string().optional(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    executionTime: z.number().optional(),
    parameterValidation: z.object({
        valid: z.boolean(),
        errors: z.array(z.string()),
    }).optional(),
});
export class QueryEngine {
    db;
    config;
    activeExecutions = new Map();
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    /**
     * Create a new query
     */
    async createQuery(queryData) {
        try {
            // Validate query data
            const validation = QueryModel.validateCreate(queryData);
            if (!validation.valid) {
                throw new Error(`Query validation failed: ${validation.errors.join(', ')}`);
            }
            // Check if query name already exists
            const existing = this.db.prepare('SELECT id FROM queries WHERE name = ?').get(queryData.name);
            if (existing) {
                throw new Error(`Query with name '${queryData.name}' already exists`);
            }
            // Verify tool exists
            const tool = this.db.prepare('SELECT id FROM tools WHERE id = ? AND status = ?').get(queryData.toolId, 'active');
            if (!tool) {
                throw new Error(`Tool with ID '${queryData.toolId}' not found or inactive`);
            }
            // Create query
            const query = QueryModel.create(queryData);
            const dbData = QueryModel.toDatabase(query);
            const stmt = this.db.prepare(`
        INSERT INTO queries (
          id, name, description, tool_id, schema_version, parameters,
          operation, output_schema, created_at, updated_at, 
          execution_count, last_executed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(dbData.id, dbData.name, dbData.description, dbData.tool_id, dbData.schema_version, dbData.parameters, dbData.operation, dbData.output_schema, dbData.created_at, dbData.updated_at, dbData.execution_count, dbData.last_executed);
            return query;
        }
        catch (error) {
            throw new Error(`Failed to create query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get query by ID or name
     */
    async getQuery(identifier) {
        try {
            // Try by ID first (UUID format)
            let row = null;
            if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                row = this.db.prepare('SELECT * FROM queries WHERE id = ?').get(identifier);
            }
            else {
                // Try by name
                row = this.db.prepare('SELECT * FROM queries WHERE name = ?').get(identifier);
            }
            return row ? QueryModel.fromDatabase(row) : null;
        }
        catch (error) {
            throw new Error(`Failed to get query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List queries with optional filters
     */
    async listQueries(filters = {}, limit = 100, offset = 0) {
        try {
            // Build WHERE clause
            const conditions = [];
            const params = [];
            if (filters.toolId) {
                conditions.push('tool_id = ?');
                params.push(filters.toolId);
            }
            if (filters.search) {
                conditions.push('(name LIKE ? OR description LIKE ?)');
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }
            if (filters.createdAfter) {
                conditions.push('created_at >= ?');
                params.push(filters.createdAfter);
            }
            if (filters.createdBefore) {
                conditions.push('created_at <= ?');
                params.push(filters.createdBefore);
            }
            if (filters.lastExecutedAfter) {
                conditions.push('last_executed >= ?');
                params.push(filters.lastExecutedAfter);
            }
            if (filters.hasBeenExecuted !== undefined) {
                if (filters.hasBeenExecuted) {
                    conditions.push('execution_count > 0');
                }
                else {
                    conditions.push('execution_count = 0');
                }
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `SELECT COUNT(*) as count FROM queries ${whereClause}`;
            const countResult = this.db.prepare(countQuery).get(...params);
            const total = countResult.count;
            // Get queries
            const query = `
        SELECT * FROM queries ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
            params.push(limit, offset);
            const rows = this.db.prepare(query).all(...params);
            const queries = rows.map(row => QueryModel.fromDatabase(row));
            return {
                queries,
                total,
                hasMore: offset + queries.length < total,
            };
        }
        catch (error) {
            throw new Error(`Failed to list queries: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update an existing query
     */
    async updateQuery(queryId, updates) {
        try {
            // Get existing query
            const existing = await this.getQuery(queryId);
            if (!existing) {
                throw new Error(`Query with ID '${queryId}' not found`);
            }
            // Check if name is being changed and if it conflicts
            if (updates.name && updates.name !== existing.name) {
                const nameConflict = this.db.prepare('SELECT id FROM queries WHERE name = ? AND id != ?').get(updates.name, queryId);
                if (nameConflict) {
                    throw new Error(`Query with name '${updates.name}' already exists`);
                }
            }
            // Apply updates
            const updatedQuery = QueryModel.update(existing, updates);
            const dbData = QueryModel.toDatabase(updatedQuery);
            const stmt = this.db.prepare(`
        UPDATE queries SET
          name = ?, description = ?, parameters = ?, operation = ?,
          output_schema = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(dbData.name, dbData.description, dbData.parameters, dbData.operation, dbData.output_schema, dbData.updated_at, dbData.id);
            return updatedQuery;
        }
        catch (error) {
            throw new Error(`Failed to update query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Delete a query and its executions
     */
    async deleteQuery(queryId) {
        try {
            // Delete executions first (CASCADE should handle this, but be explicit)
            this.db.prepare('DELETE FROM executions WHERE query_id = ?').run(queryId);
            // Delete query
            const stmt = this.db.prepare('DELETE FROM queries WHERE id = ?');
            const result = stmt.run(queryId);
            return result.changes > 0;
        }
        catch (error) {
            throw new Error(`Failed to delete query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute a query with parameters
     */
    async executeQuery(queryId, parameters = {}, collectorInputs = {}, options = {}) {
        const opts = QueryExecutionOptionsSchema.parse({
            ...this.config.performance,
            timeout: this.config.performance.queryTimeout * 1000,
            ...options,
        });
        const executionId = crypto.randomUUID();
        const startTime = Date.now();
        try {
            // Get query
            const query = await this.getQuery(queryId);
            if (!query) {
                throw new Error(`Query with ID '${queryId}' not found`);
            }
            // Validate parameters
            const paramValidation = this.validateQueryParameters(query, parameters);
            if (!paramValidation.valid && opts.validateOutput) {
                return {
                    executionId,
                    queryId: query.id,
                    status: 'failed',
                    error: `Parameter validation failed: ${paramValidation.errors.join(', ')}`,
                    startedAt: new Date(startTime).toISOString(),
                    parameterValidation: paramValidation,
                };
            }
            // Create execution record
            if (opts.saveExecution) {
                await this.createExecutionRecord(executionId, query.id, parameters, collectorInputs);
            }
            // Set up abort controller for timeout
            const abortController = new AbortController();
            this.activeExecutions.set(executionId, abortController);
            const timeoutId = setTimeout(() => {
                abortController.abort();
            }, opts.timeout);
            try {
                // Execute query (this would integrate with MCP client)
                const result = await this.performQueryExecution(query, parameters, collectorInputs, abortController.signal);
                clearTimeout(timeoutId);
                const completedAt = new Date().toISOString();
                const executionTime = Date.now() - startTime;
                // Update execution record
                if (opts.saveExecution) {
                    await this.updateExecutionRecord(executionId, {
                        status: 'completed',
                        result: JSON.stringify(result),
                        completedAt,
                    });
                }
                // Update query statistics
                await this.updateQueryStatistics(query.id, completedAt);
                return {
                    executionId,
                    queryId: query.id,
                    status: 'completed',
                    result,
                    startedAt: new Date(startTime).toISOString(),
                    completedAt,
                    executionTime,
                    parameterValidation: paramValidation,
                };
            }
            catch (error) {
                clearTimeout(timeoutId);
                const status = abortController.signal.aborted ? 'timeout' : 'failed';
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Update execution record
                if (opts.saveExecution) {
                    await this.updateExecutionRecord(executionId, {
                        status,
                        errorDetails: JSON.stringify({ error: errorMessage }),
                        completedAt: new Date().toISOString(),
                    });
                }
                return {
                    executionId,
                    queryId: query.id,
                    status,
                    error: errorMessage,
                    startedAt: new Date(startTime).toISOString(),
                    completedAt: new Date().toISOString(),
                    executionTime: Date.now() - startTime,
                    parameterValidation: paramValidation,
                };
            }
        }
        finally {
            this.activeExecutions.delete(executionId);
        }
    }
    /**
     * Cancel a running query execution
     */
    async cancelExecution(executionId) {
        const abortController = this.activeExecutions.get(executionId);
        if (!abortController) {
            return false;
        }
        abortController.abort();
        // Update execution record
        await this.updateExecutionRecord(executionId, {
            status: 'cancelled',
            completedAt: new Date().toISOString(),
        });
        return true;
    }
    /**
     * Get execution history for a query
     */
    async getExecutionHistory(queryId, limit = 50, offset = 0) {
        try {
            // Get total count
            const countResult = this.db.prepare('SELECT COUNT(*) as count FROM executions WHERE query_id = ?').get(queryId);
            // Get executions
            const rows = this.db.prepare(`
        SELECT * FROM executions 
        WHERE query_id = ?
        ORDER BY started_at DESC
        LIMIT ? OFFSET ?
      `).all(queryId, limit, offset);
            const executions = rows.map(row => ExecutionModel.fromDatabase(row));
            return {
                executions,
                total: countResult.count,
                hasMore: offset + executions.length < countResult.count,
            };
        }
        catch (error) {
            throw new Error(`Failed to get execution history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get query statistics
     */
    async getQueryStats(queryId) {
        try {
            let queryFilter = '';
            const params = [];
            if (queryId) {
                queryFilter = 'WHERE q.id = ?';
                params.push(queryId);
            }
            const stats = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT q.id) as total_queries,
          COUNT(e.id) as total_executions,
          COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as successful_executions,
          COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed_executions,
          AVG(CASE WHEN e.completed_at IS NOT NULL THEN 
            CAST((julianday(e.completed_at) - julianday(e.started_at)) * 86400 AS REAL)
          END) as avg_execution_time
        FROM queries q
        LEFT JOIN executions e ON q.id = e.query_id
        ${queryFilter}
      `).get(...params);
            const topQueries = this.db.prepare(`
        SELECT q.id, q.name, q.execution_count, q.last_executed
        FROM queries q
        ${queryFilter}
        ORDER BY q.execution_count DESC, q.last_executed DESC
        LIMIT 10
      `).all(...params);
            return {
                totalQueries: stats.total_queries || 0,
                totalExecutions: stats.total_executions || 0,
                successfulExecutions: stats.successful_executions || 0,
                failedExecutions: stats.failed_executions || 0,
                averageExecutionTime: Math.round((stats.avg_execution_time || 0) * 1000) / 1000,
                topQueries: topQueries.map(q => ({
                    id: q.id,
                    name: q.name,
                    executionCount: q.execution_count,
                    lastExecuted: q.last_executed || undefined,
                })),
            };
        }
        catch (error) {
            throw new Error(`Failed to get query stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Private helper methods
    validateQueryParameters(query, parameters) {
        try {
            const parameterSchema = JSON.parse(query.parameters);
            // Basic JSON Schema validation (simplified)
            const errors = [];
            if (parameterSchema.type === 'object' && parameterSchema.properties) {
                // Check required properties
                if (parameterSchema.required && Array.isArray(parameterSchema.required)) {
                    for (const required of parameterSchema.required) {
                        if (!(required in parameters)) {
                            errors.push(`Missing required parameter: ${required}`);
                        }
                    }
                }
                // Check property types (basic validation)
                for (const [key, value] of Object.entries(parameters)) {
                    const propSchema = parameterSchema.properties[key];
                    if (propSchema && propSchema.type) {
                        const actualType = typeof value;
                        const expectedType = propSchema.type;
                        if (expectedType === 'number' && actualType !== 'number') {
                            errors.push(`Parameter '${key}' should be a number`);
                        }
                        else if (expectedType === 'string' && actualType !== 'string') {
                            errors.push(`Parameter '${key}' should be a string`);
                        }
                        else if (expectedType === 'boolean' && actualType !== 'boolean') {
                            errors.push(`Parameter '${key}' should be a boolean`);
                        }
                        else if (expectedType === 'array' && !Array.isArray(value)) {
                            errors.push(`Parameter '${key}' should be an array`);
                        }
                    }
                }
            }
            return {
                valid: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [`Invalid parameter schema: ${error instanceof Error ? error.message : String(error)}`],
            };
        }
    }
    async performQueryExecution(query, parameters, collectorInputs, abortSignal) {
        // This is where the actual MCP call would be made
        // For now, return a mock result based on the operation
        const operation = JSON.parse(query.operation);
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        // Check if aborted
        if (abortSignal.aborted) {
            throw new Error('Execution was aborted');
        }
        // Mock result based on operation type
        return {
            operation: operation.method || 'unknown',
            parameters,
            collectorInputs,
            timestamp: new Date().toISOString(),
            result: 'Mock execution result - MCP integration pending',
        };
    }
    async createExecutionRecord(executionId, queryId, parameters, collectorInputs) {
        const execution = {
            id: executionId,
            queryId,
            parameters: JSON.stringify(parameters),
            collectorInputs: JSON.stringify(collectorInputs),
            credentialRefs: JSON.stringify([]), // TODO: populate from auth manager
            status: 'running',
        };
        const executionObj = ExecutionModel.create(execution);
        const dbData = ExecutionModel.toDatabase(executionObj);
        const stmt = this.db.prepare(`
      INSERT INTO executions (
        id, query_id, parameters, collector_inputs, credential_refs,
        status, started_at, completed_at, result, error_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(dbData.id, dbData.query_id, dbData.parameters, dbData.collector_inputs, dbData.credential_refs, dbData.status, dbData.started_at, dbData.completed_at, dbData.result, dbData.error_details);
    }
    async updateExecutionRecord(executionId, updates) {
        const fields = [];
        const values = [];
        if (updates.status) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.result) {
            fields.push('result = ?');
            values.push(updates.result);
        }
        if (updates.errorDetails) {
            fields.push('error_details = ?');
            values.push(updates.errorDetails);
        }
        if (updates.completedAt) {
            fields.push('completed_at = ?');
            values.push(updates.completedAt);
        }
        if (fields.length === 0)
            return;
        values.push(executionId);
        const stmt = this.db.prepare(`UPDATE executions SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
    }
    async updateQueryStatistics(queryId, lastExecuted) {
        const stmt = this.db.prepare(`
      UPDATE queries SET 
        execution_count = execution_count + 1,
        last_executed = ?
      WHERE id = ?
    `);
        stmt.run(lastExecuted, queryId);
    }
}
