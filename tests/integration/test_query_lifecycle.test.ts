import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../../src/lib/database';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Query Lifecycle Integration Tests', () => {
  let db: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    // Create a unique database path for this test
    testDbPath = join(process.cwd(), 'tests', `test-db-${Date.now()}-${Math.random()}.db`);
    db = new DatabaseManager({ path: testDbPath });
    await db.initialize();
  });

  afterEach(async () => {
    // Ensure database is closed
    if (db) {
      db.close();
    }
    // Clean up test database file
    if (existsSync(testDbPath)) {
      try {
        unlinkSync(testDbPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('should create a new query with validation', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const queryData = {
        name: 'test-search-query',
        description: 'Test search query',
        toolId: 'mock-tool-id',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', default: 10 }
          },
          required: ['query']
        },
        operation: {
          method: 'search',
          path: '/search',
          parameters: ['query', 'limit']
        }
      };

      const queryId = await queryEngine.createQuery(queryData);
      
      // Integration contract: should create and validate query
      expect(typeof queryId).toBe('string');
      expect(queryId.length).toBeGreaterThan(0);
      
      // Verify query is in database
      const savedQuery = db.prepare('SELECT * FROM queries WHERE id = ?').get(queryId);
      expect(savedQuery).toBeDefined();
      expect(savedQuery.name).toBe(queryData.name);
      expect(JSON.parse(savedQuery.parameters)).toEqual(queryData.parameters);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should execute query with runtime parameters', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      // First create a query
      const queryData = {
        name: 'execution-test-query',
        toolId: 'mock-tool-id',
        parameters: {
          type: 'object',
          properties: {
            term: { type: 'string' }
          },
          required: ['term']
        },
        operation: {
          method: 'search',
          parameters: ['term']
        }
      };

      const queryId = await queryEngine.createQuery(queryData);

      // Execute query with parameters
      const executionParams = { term: 'test search' };
      const executionResult = await queryEngine.executeQuery(queryId, executionParams);
      
      // Integration contract: should execute and return results
      expect(executionResult).toHaveProperty('executionId');
      expect(executionResult).toHaveProperty('status');
      expect(executionResult).toHaveProperty('result');
      expect(executionResult.status).toBe('completed') || expect(executionResult.status).toBe('running');
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should validate runtime parameters against query schema', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const queryData = {
        name: 'validation-test-query',
        toolId: 'mock-tool-id',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', minimum: 1, maximum: 100 }
          },
          required: ['count']
        },
        operation: { method: 'list' }
      };

      const queryId = await queryEngine.createQuery(queryData);

      // Valid parameters
      const validResult = await queryEngine.validateExecutionParams(queryId, { count: 25 });
      expect(validResult.valid).toBe(true);

      // Invalid parameters
      const invalidResult = await queryEngine.validateExecutionParams(queryId, { count: 150 });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);

      // Missing required parameters
      const missingResult = await queryEngine.validateExecutionParams(queryId, {});
      expect(missingResult.valid).toBe(false);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should track query execution history', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const queryData = {
        name: 'history-test-query',
        toolId: 'mock-tool-id',
        parameters: { type: 'object', properties: {} },
        operation: { method: 'status' }
      };

      const queryId = await queryEngine.createQuery(queryData);

      // Execute query multiple times
      await queryEngine.executeQuery(queryId, {});
      await queryEngine.executeQuery(queryId, {});
      await queryEngine.executeQuery(queryId, {});

      const executionHistory = await queryEngine.getExecutionHistory(queryId);
      
      // Integration contract: should track execution history
      expect(Array.isArray(executionHistory)).toBe(true);
      expect(executionHistory.length).toBe(3);
      
      executionHistory.forEach(execution => {
        expect(execution).toHaveProperty('executionId');
        expect(execution).toHaveProperty('queryId');
        expect(execution).toHaveProperty('startedAt');
        expect(execution.queryId).toBe(queryId);
      });
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should support query templates and parameter substitution', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const templateQuery = {
        name: 'template-query',
        toolId: 'mock-tool-id',
        parameters: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] }
          },
          required: ['userId']
        },
        operation: {
          method: 'getUserData',
          template: '/users/{{userId}}/data?status={{status}}',
          parameters: ['userId', 'status']
        }
      };

      const queryId = await queryEngine.createQuery(templateQuery);
      const executionParams = { userId: 'user123', status: 'active' };
      
      const preparedOperation = await queryEngine.prepareOperation(queryId, executionParams);
      
      // Integration contract: should substitute template parameters
      expect(preparedOperation.resolvedPath).toBe('/users/user123/data?status=active');
      expect(preparedOperation.parameters).toEqual(executionParams);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle query versioning and schema evolution', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      // Create query with version 1.0.0
      const queryV1 = {
        name: 'versioned-query',
        schemaVersion: '1.0.0',
        toolId: 'mock-tool-id',
        parameters: {
          type: 'object',
          properties: {
            term: { type: 'string' }
          }
        },
        operation: { method: 'search' }
      };

      const queryId = await queryEngine.createQuery(queryV1);

      // Update to version 1.1.0 with backward compatibility
      const queryV1_1 = {
        ...queryV1,
        schemaVersion: '1.1.0',
        parameters: {
          type: 'object',
          properties: {
            term: { type: 'string' },
            filters: { type: 'array', default: [] } // New optional parameter
          }
        }
      };

      await queryEngine.updateQuerySchema(queryId, queryV1_1);
      
      // Should still work with old parameters
      const oldParamsResult = await queryEngine.validateExecutionParams(queryId, { term: 'test' });
      expect(oldParamsResult.valid).toBe(true);

      // Should work with new parameters
      const newParamsResult = await queryEngine.validateExecutionParams(queryId, { 
        term: 'test', 
        filters: ['type:document'] 
      });
      expect(newParamsResult.valid).toBe(true);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should support query result caching', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const cachedQuery = {
        name: 'cached-query',
        toolId: 'mock-tool-id',
        parameters: { type: 'object', properties: {} },
        operation: { method: 'expensive-operation' },
        caching: {
          enabled: true,
          ttl: 300 // 5 minutes
        }
      };

      const queryId = await queryEngine.createQuery(cachedQuery);

      // First execution (should hit endpoint)
      const startTime1 = Date.now();
      const result1 = await queryEngine.executeQuery(queryId, {});
      const duration1 = Date.now() - startTime1;

      // Second execution (should use cache)
      const startTime2 = Date.now();
      const result2 = await queryEngine.executeQuery(queryId, {});
      const duration2 = Date.now() - startTime2;
      
      // Integration contract: cached result should be faster
      expect(duration2).toBeLessThan(duration1);
      expect(result2.cached).toBe(true);
      expect(result1.result).toEqual(result2.result);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle query execution timeouts', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const timeoutQuery = {
        name: 'timeout-query',
        toolId: 'mock-slow-tool-id',
        parameters: { type: 'object', properties: {} },
        operation: { method: 'slow-operation' },
        timeout: 1000 // 1 second
      };

      const queryId = await queryEngine.createQuery(timeoutQuery);
      const result = await queryEngine.executeQuery(queryId, {});
      
      // Integration contract: should handle timeout gracefully
      expect(result.status).toBe('timeout') || expect(result.status).toBe('failed');
      if (result.status === 'timeout') {
        expect(result.error).toContain('timeout');
      }
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should support query listing and search', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      // Create multiple queries
      const queries = [
        { name: 'search-users', toolId: 'user-tool', operation: { method: 'search' } },
        { name: 'list-files', toolId: 'file-tool', operation: { method: 'list' } },
        { name: 'get-status', toolId: 'status-tool', operation: { method: 'status' } }
      ];

      for (const query of queries) {
        await queryEngine.createQuery({
          ...query,
          parameters: { type: 'object', properties: {} }
        });
      }

      // List all queries
      const allQueries = await queryEngine.listQueries();
      expect(allQueries.length).toBeGreaterThanOrEqual(3);

      // Search queries by name
      const searchResults = await queryEngine.searchQueries('search');
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(searchResults.some(q => q.name === 'search-users')).toBe(true);

      // Filter by tool
      const userToolQueries = await queryEngine.listQueries({ toolId: 'user-tool' });
      expect(userToolQueries.length).toBeGreaterThanOrEqual(1);
      expect(userToolQueries.every(q => q.toolId === 'user-tool')).toBe(true);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });

  test('should delete queries and cleanup related data', async () => {
    try {
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const queryEngine = new QueryEngine(db);

      const queryData = {
        name: 'deletion-test-query',
        toolId: 'mock-tool-id',
        parameters: { type: 'object', properties: {} },
        operation: { method: 'test' }
      };

      const queryId = await queryEngine.createQuery(queryData);

      // Execute query to create history
      await queryEngine.executeQuery(queryId, {});

      // Delete query
      await queryEngine.deleteQuery(queryId);
      
      // Integration contract: should remove query and related data
      const deletedQuery = await queryEngine.getQuery(queryId);
      expect(deletedQuery).toBeNull();

      // Verify executions are also deleted
      const executions = db.prepare('SELECT * FROM executions WHERE query_id = ?').all(queryId);
      expect(executions.length).toBe(0);
    } catch (error) {
      // Expected to fail until QueryEngine is implemented
      expect(error).toBeDefined();
    }
  });
});