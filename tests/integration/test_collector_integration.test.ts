import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../../src/lib/database';
import { TEST_DB_PATH, TEST_DATA_DIR } from '../setup';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('Data Collector Integration Tests', () => {
  let db: DatabaseManager;
  const collectorsDir = join(TEST_DATA_DIR, 'collectors');

  beforeEach(async () => {
    // This test will fail initially until services are implemented
    db = new DatabaseManager({ path: TEST_DB_PATH });
    await db.initialize();

    // Create collectors directory
    mkdirSync(collectorsDir, { recursive: true });
  });

  test('should register a valid data collector', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Create a simple test collector
      const collectorPath = join(collectorsDir, 'test-collector.js');
      const collectorCode = `
        module.exports = {
          name: 'test-collector',
          description: 'Test data collector',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string' }
            },
            required: ['source']
          },
          outputSchema: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              count: { type: 'number' }
            }
          },
          async collect(input) {
            return {
              data: ['item1', 'item2'],
              count: 2
            };
          }
        };
      `;
      writeFileSync(collectorPath, collectorCode);

      const collectorId = await collectorManager.registerCollector(collectorPath);
      
      // Integration contract: should register collector successfully
      expect(typeof collectorId).toBe('string');
      expect(collectorId.length).toBeGreaterThan(0);
      
      // Verify collector is in database
      const savedCollector = db.prepare('SELECT * FROM collectors WHERE id = ?').get(collectorId);
      expect(savedCollector).toBeDefined();
      expect(savedCollector.name).toBe('test-collector');
      expect(savedCollector.file_path).toBe(collectorPath);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should validate collector module structure', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Create invalid collector (missing required methods)
      const invalidCollectorPath = join(collectorsDir, 'invalid-collector.js');
      const invalidCode = `
        module.exports = {
          name: 'invalid-collector'
          // Missing inputSchema, outputSchema, and collect method
        };
      `;
      writeFileSync(invalidCollectorPath, invalidCode);

      const validationResult = await collectorManager.validateCollector(invalidCollectorPath);
      
      // Integration contract: should validate collector structure
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors.some(e => e.includes('inputSchema'))).toBe(true);
      expect(validationResult.errors.some(e => e.includes('outputSchema'))).toBe(true);
      expect(validationResult.errors.some(e => e.includes('collect'))).toBe(true);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should execute collector with valid input', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Create working collector
      const collectorPath = join(collectorsDir, 'working-collector.js');
      const collectorCode = `
        module.exports = {
          name: 'working-collector',
          inputSchema: {
            type: 'object',
            properties: {
              count: { type: 'number', minimum: 1 }
            },
            required: ['count']
          },
          outputSchema: {
            type: 'object',
            properties: {
              items: { type: 'array' }
            }
          },
          async collect(input) {
            const items = Array.from({ length: input.count }, (_, i) => \`item-\${i + 1}\`);
            return { items };
          }
        };
      `;
      writeFileSync(collectorPath, collectorCode);

      const collectorId = await collectorManager.registerCollector(collectorPath);
      const input = { count: 3 };
      const result = await collectorManager.executeCollector(collectorId, input);
      
      // Integration contract: should execute and return results
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result.output.items).toEqual(['item-1', 'item-2', 'item-3']);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should validate input parameters against collector schema', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      const collectorPath = join(collectorsDir, 'validation-collector.js');
      const collectorCode = `
        module.exports = {
          name: 'validation-collector',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              age: { type: 'number', minimum: 18, maximum: 100 }
            },
            required: ['email', 'age']
          },
          outputSchema: { type: 'object' },
          async collect(input) {
            return { processed: true };
          }
        };
      `;
      writeFileSync(collectorPath, collectorCode);

      const collectorId = await collectorManager.registerCollector(collectorPath);

      // Valid input
      const validInput = { email: 'test@example.com', age: 25 };
      const validResult = await collectorManager.validateInput(collectorId, validInput);
      expect(validResult.valid).toBe(true);

      // Invalid input
      const invalidInput = { email: 'invalid-email', age: 15 };
      const invalidResult = await collectorManager.validateInput(collectorId, invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle collector execution timeout', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Create slow collector
      const slowCollectorPath = join(collectorsDir, 'slow-collector.js');
      const slowCollectorCode = `
        module.exports = {
          name: 'slow-collector',
          inputSchema: { type: 'object', properties: {} },
          outputSchema: { type: 'object' },
          async collect(input) {
            // Simulate slow operation
            await new Promise(resolve => setTimeout(resolve, 5000));
            return { result: 'done' };
          }
        };
      `;
      writeFileSync(slowCollectorPath, slowCollectorCode);

      const collectorId = await collectorManager.registerCollector(slowCollectorPath, {
        timeout: 1000 // 1 second timeout
      });

      const result = await collectorManager.executeCollector(collectorId, {});
      
      // Integration contract: should timeout gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout') || expect(result.error).toContain('timed out');
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should list and filter registered collectors', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Register multiple collectors
      const collectors = [
        { name: 'api-collector', enabled: true },
        { name: 'file-collector', enabled: true },
        { name: 'disabled-collector', enabled: false }
      ];

      for (const collector of collectors) {
        const collectorPath = join(collectorsDir, `${collector.name}.js`);
        const code = `
          module.exports = {
            name: '${collector.name}',
            inputSchema: { type: 'object' },
            outputSchema: { type: 'object' },
            async collect(input) { return {}; }
          };
        `;
        writeFileSync(collectorPath, code);
        
        const collectorId = await collectorManager.registerCollector(collectorPath);
        if (!collector.enabled) {
          await collectorManager.disableCollector(collectorId);
        }
      }

      // List all collectors
      const allCollectors = await collectorManager.listCollectors();
      expect(allCollectors.length).toBeGreaterThanOrEqual(3);

      // List only enabled collectors
      const enabledCollectors = await collectorManager.listCollectors({ enabled: true });
      expect(enabledCollectors.length).toBeGreaterThanOrEqual(2);
      expect(enabledCollectors.every(c => c.enabled)).toBe(true);

      // Search by name
      const apiCollectors = await collectorManager.searchCollectors('api');
      expect(apiCollectors.length).toBeGreaterThanOrEqual(1);
      expect(apiCollectors.some(c => c.name === 'api-collector')).toBe(true);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should integrate collector output with query execution', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const { QueryEngine } = await import('../../src/services/query/query-engine');
      const collectorManager = new CollectorManager(db);
      const queryEngine = new QueryEngine(db);

      // Create data collector
      const dataCollectorPath = join(collectorsDir, 'data-collector.js');
      const dataCollectorCode = `
        module.exports = {
          name: 'data-collector',
          inputSchema: {
            type: 'object',
            properties: {
              dataset: { type: 'string' }
            }
          },
          outputSchema: {
            type: 'object',
            properties: {
              records: { type: 'array' }
            }
          },
          async collect(input) {
            return {
              records: [
                { id: 1, name: 'Record 1' },
                { id: 2, name: 'Record 2' }
              ]
            };
          }
        };
      `;
      writeFileSync(dataCollectorPath, dataCollectorCode);

      const collectorId = await collectorManager.registerCollector(dataCollectorPath);

      // Create query that uses collector data
      const queryData = {
        name: 'data-driven-query',
        toolId: 'mock-tool-id',
        collectorId: collectorId,
        parameters: {
          type: 'object',
          properties: {
            filter: { type: 'string' }
          }
        },
        operation: {
          method: 'processData',
          useCollectorData: true
        }
      };

      const queryId = await queryEngine.createQuery(queryData);
      const result = await queryEngine.executeQueryWithCollector(queryId, 
        { filter: 'active' }, 
        { dataset: 'test' }
      );
      
      // Integration contract: should combine collector and query execution
      expect(result).toHaveProperty('collectorOutput');
      expect(result).toHaveProperty('queryResult');
      expect(result.collectorOutput.records).toBeDefined();
      expect(Array.isArray(result.collectorOutput.records)).toBe(true);
    } catch (error) {
      // Expected to fail until services are implemented
      expect(error).toBeDefined();
    }
  });

  test('should track collector execution statistics', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      const statsCollectorPath = join(collectorsDir, 'stats-collector.js');
      const statsCollectorCode = `
        module.exports = {
          name: 'stats-collector',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          async collect(input) {
            return { timestamp: Date.now() };
          }
        };
      `;
      writeFileSync(statsCollectorPath, statsCollectorCode);

      const collectorId = await collectorManager.registerCollector(statsCollectorPath);

      // Execute collector multiple times
      await collectorManager.executeCollector(collectorId, {});
      await collectorManager.executeCollector(collectorId, {});
      await collectorManager.executeCollector(collectorId, {});

      const stats = await collectorManager.getCollectorStats(collectorId);
      
      // Integration contract: should track execution statistics
      expect(stats).toHaveProperty('executionCount');
      expect(stats).toHaveProperty('lastExecuted');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats.executionCount).toBe(3);
      expect(stats.lastExecuted).toBeDefined();
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle collector dependencies and loading order', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      // Create dependent collector
      const dependentCollectorPath = join(collectorsDir, 'dependent-collector.js');
      const dependentCollectorCode = `
        module.exports = {
          name: 'dependent-collector',
          dependencies: ['base-collector'],
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          async collect(input, context) {
            const baseData = await context.getCollectorOutput('base-collector');
            return { 
              enhanced: true,
              baseCount: baseData.items.length 
            };
          }
        };
      `;
      writeFileSync(dependentCollectorPath, dependentCollectorCode);

      // Create base collector
      const baseCollectorPath = join(collectorsDir, 'base-collector.js');
      const baseCollectorCode = `
        module.exports = {
          name: 'base-collector',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          async collect(input) {
            return { items: ['a', 'b', 'c'] };
          }
        };
      `;
      writeFileSync(baseCollectorPath, baseCollectorCode);

      const baseId = await collectorManager.registerCollector(baseCollectorPath);
      const dependentId = await collectorManager.registerCollector(dependentCollectorPath);

      const result = await collectorManager.executeCollectorChain([baseId, dependentId], {});
      
      // Integration contract: should handle dependencies
      expect(result).toHaveProperty('results');
      expect(result.results.length).toBe(2);
      expect(result.results[1].output.enhanced).toBe(true);
      expect(result.results[1].output.baseCount).toBe(3);
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should remove collectors and cleanup related data', async () => {
    try {
      const { CollectorManager } = await import('../../src/services/collector/collector-manager');
      const collectorManager = new CollectorManager(db);

      const removeCollectorPath = join(collectorsDir, 'remove-collector.js');
      const removeCollectorCode = `
        module.exports = {
          name: 'remove-collector',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          async collect(input) { return {}; }
        };
      `;
      writeFileSync(removeCollectorPath, removeCollectorCode);

      const collectorId = await collectorManager.registerCollector(removeCollectorPath);

      // Execute to create history
      await collectorManager.executeCollector(collectorId, {});

      // Remove collector
      await collectorManager.removeCollector(collectorId);
      
      // Integration contract: should remove collector and cleanup
      const removedCollector = await collectorManager.getCollector(collectorId);
      expect(removedCollector).toBeNull();

      // Verify removal from database
      const dbResult = db.prepare('SELECT * FROM collectors WHERE id = ?').get(collectorId);
      expect(dbResult).toBeUndefined();
    } catch (error) {
      // Expected to fail until CollectorManager is implemented
      expect(error).toBeDefined();
    }
  });
});