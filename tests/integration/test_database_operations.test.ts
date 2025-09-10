import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../../src/lib/database';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Database Operations Integration Tests', () => {
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

  test('should initialize database with correct schema', async () => {
    const healthCheck = await db.healthCheck();
    expect(healthCheck).toBe(true);

    // Verify all tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    const expectedTables = [
      'audit_log',
      'collectors', 
      'configuration',
      'credentials',
      'executions',
      'queries',
      'schema_version',
      'tools'
    ];

    const tableNames = tables.map(t => t.name);
    expectedTables.forEach(tableName => {
      expect(tableNames).toContain(tableName);
    });
  });

  test('should enforce foreign key constraints', async () => {
    // Try to insert credential with non-existent tool_id
    const insertCredential = db.prepare(`
      INSERT INTO credentials (id, tool_id, auth_type, encrypted_data, encryption_key_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    expect(() => {
      insertCredential.run(
        'cred-1',
        'nonexistent-tool',
        'api_key',
        Buffer.from('encrypted'),
        'key-1'
      );
    }).toThrow();
  });

  test('should validate check constraints', async () => {
    // Try to insert invalid auth_type
    const insertInvalidAuth = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertInvalidAuth.run(
      'tool-1',
      'test-tool',
      '1.0.0',
      'http://example.com',
      '[]',
      '{}'
    );

    const insertCredential = db.prepare(`
      INSERT INTO credentials (id, tool_id, auth_type, encrypted_data, encryption_key_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    expect(() => {
      insertCredential.run(
        'cred-1',
        'tool-1',
        'invalid_type', // Should violate CHECK constraint
        Buffer.from('encrypted'),
        'key-1'
      );
    }).toThrow();
  });

  test('should automatically update timestamps on modifications', async () => {
    // Insert a tool
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertTool.run(
      'tool-1',
      'test-tool',
      '1.0.0',
      'http://example.com',
      '[]',
      '{}'
    );

    const originalTool = db.prepare('SELECT * FROM tools WHERE id = ?').get('tool-1');
    const originalUpdatedAt = originalTool.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1100)); // SQLite CURRENT_TIMESTAMP is only second precision

    // Update the tool
    const updateTool = db.prepare('UPDATE tools SET description = ? WHERE id = ?');
    updateTool.run('Updated description', 'tool-1');

    const updatedTool = db.prepare('SELECT * FROM tools WHERE id = ?').get('tool-1');
    const newUpdatedAt = updatedTool.updated_at;

    // Timestamp should have been automatically updated
    expect(newUpdatedAt).not.toBe(originalUpdatedAt);
    expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
  });

  test('should increment execution counts via triggers', async () => {
    // Insert tool and query
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertTool.run('tool-1', 'test-tool', '1.0.0', 'http://example.com', '[]', '{}');

    const insertQuery = db.prepare(`
      INSERT INTO queries (id, name, tool_id, parameters, operation)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertQuery.run('query-1', 'test-query', 'tool-1', '{}', '{}');

    const originalQuery = db.prepare('SELECT execution_count FROM queries WHERE id = ?').get('query-1');
    expect(originalQuery.execution_count).toBe(0);

    // Insert completed execution
    const insertExecution = db.prepare(`
      INSERT INTO executions (id, query_id, status, completed_at)
      VALUES (?, ?, ?, ?)
    `);
    
    insertExecution.run('exec-1', 'query-1', 'completed', new Date().toISOString());

    const updatedQuery = db.prepare('SELECT execution_count, last_executed FROM queries WHERE id = ?').get('query-1');
    
    // Execution count should have been incremented by trigger
    expect(updatedQuery.execution_count).toBe(1);
    expect(updatedQuery.last_executed).toBeDefined();
  });

  test('should support database transactions', async () => {
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertQuery = db.prepare(`
      INSERT INTO queries (id, name, tool_id, parameters, operation)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Successful transaction
    db.transaction(() => {
      insertTool.run('tool-1', 'test-tool', '1.0.0', 'http://example.com', '[]', '{}');
      insertQuery.run('query-1', 'test-query', 'tool-1', '{}', '{}');
    });

    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get('tool-1');
    const query = db.prepare('SELECT * FROM queries WHERE id = ?').get('query-1');
    expect(tool).toBeDefined();
    expect(query).toBeDefined();

    // Failed transaction (should rollback)
    expect(() => {
      db.transaction(() => {
        insertTool.run('tool-2', 'test-tool-2', '1.0.0', 'http://example.com', '[]', '{}');
        insertQuery.run('query-2', 'test-query-2', 'nonexistent-tool', '{}', '{}'); // Should fail
      });
    }).toThrow();

    const tool2 = db.prepare('SELECT * FROM tools WHERE id = ?').get('tool-2');
    const query2 = db.prepare('SELECT * FROM queries WHERE id = ?').get('query-2');
    expect(tool2).toBeNull(); // Should not exist due to rollback
    expect(query2).toBeNull();
  });

  test('should support database views for complex queries', async () => {
    // Insert test data
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertTool.run('tool-1', 'active-tool', '1.0.0', 'http://example.com', '[]', '{}', 'active');
    insertTool.run('tool-2', 'inactive-tool', '1.0.0', 'http://example.com', '[]', '{}', 'inactive');

    // Test active_tools view
    const activeTools = db.prepare('SELECT * FROM active_tools').all();
    expect(activeTools.length).toBe(1);
    expect(activeTools[0].name).toBe('active-tool');

    // Insert query and execution for testing other views
    const insertQuery = db.prepare(`
      INSERT INTO queries (id, name, tool_id, parameters, operation)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertQuery.run('query-1', 'test-query', 'tool-1', '{}', '{}');

    const insertExecution = db.prepare(`
      INSERT INTO executions (id, query_id, status, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    const later = new Date(now.getTime() + 1000);
    insertExecution.run('exec-1', 'query-1', 'completed', now.toISOString(), later.toISOString());

    // Test recent_executions view
    const recentExecutions = db.prepare('SELECT * FROM recent_executions').all();
    expect(recentExecutions.length).toBeGreaterThanOrEqual(1);
    expect(recentExecutions[0].query_name).toBe('test-query');
    expect(recentExecutions[0].duration_seconds).toBeGreaterThan(0);

    // Test query_statistics view
    const queryStats = db.prepare('SELECT * FROM query_statistics').all();
    expect(queryStats.length).toBeGreaterThanOrEqual(1);
    expect(queryStats[0].name).toBe('test-query');
  });

  test('should support configuration storage and retrieval', async () => {
    // Configuration should have default values from schema
    const configs = db.prepare('SELECT * FROM configuration').all();
    expect(configs.length).toBeGreaterThan(0);

    // Test retrieving specific config
    const securityConfig = db.prepare(`
      SELECT value FROM configuration WHERE key = ?
    `).get('security.encryption_enabled');
    
    expect(securityConfig).toBeDefined();
    expect(securityConfig.value).toBe('true');

    // Test updating configuration
    const updateConfig = db.prepare(`
      UPDATE configuration SET value = ? WHERE key = ?
    `);
    
    updateConfig.run('false', 'security.encryption_enabled');

    const updatedConfig = db.prepare(`
      SELECT value FROM configuration WHERE key = ?
    `).get('security.encryption_enabled');
    
    expect(updatedConfig.value).toBe('false');
  });

  test('should support audit logging', async () => {
    const insertAuditLog = db.prepare(`
      INSERT INTO audit_log (event_type, entity_type, entity_id, user_action, details, success)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const auditData = {
      event_type: 'tool_discovered',
      entity_type: 'tool',
      entity_id: 'tool-1',
      user_action: 'discover',
      details: '{"endpoint": "http://example.com"}',
      success: true
    };

    insertAuditLog.run(
      auditData.event_type,
      auditData.entity_type,
      auditData.entity_id,
      auditData.user_action,
      auditData.details,
      auditData.success
    );

    const auditEntries = db.prepare(`
      SELECT * FROM audit_log WHERE entity_id = ?
    `).all('tool-1');

    expect(auditEntries.length).toBe(1);
    expect(auditEntries[0].event_type).toBe('tool_discovered');
    expect(auditEntries[0].success).toBe(1); // SQLite boolean as integer
  });

  test('should maintain database performance with indexes', async () => {
    // Insert many tools to test index performance
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const startTime = Date.now();
    
    // Insert 1000 tools
    db.transaction(() => {
      for (let i = 0; i < 1000; i++) {
        insertTool.run(
          `tool-${i}`,
          `test-tool-${i}`,
          '1.0.0',
          `http://example-${i}.com`,
          '[]',
          '{}'
        );
      }
    });

    const insertTime = Date.now() - startTime;

    // Query with index (should be fast)
    const queryStartTime = Date.now();
    const results = db.prepare('SELECT * FROM tools WHERE name LIKE ?').all('test-tool-5%');
    const queryTime = Date.now() - queryStartTime;

    expect(results.length).toBeGreaterThan(0);
    expect(queryTime).toBeLessThan(100); // Should be fast with index
    expect(insertTime).toBeLessThan(5000); // Bulk insert should be reasonable
  });

  test('should handle database backup and recovery', async () => {
    // Insert some test data
    const insertTool = db.prepare(`
      INSERT INTO tools (id, name, version, endpoint, capabilities, auth_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertTool.run('tool-1', 'backup-test', '1.0.0', 'http://example.com', '[]', '{}');

    const backupPath = testDbPath + '.backup';
    
    // Create backup
    await db.backup(backupPath);

    // Verify backup was created and has data
    const backupDb = new DatabaseManager({ path: backupPath });
    const backupTool = backupDb.prepare('SELECT * FROM tools WHERE id = ?').get('tool-1');
    expect(backupTool).toBeDefined();
    expect(backupTool.name).toBe('backup-test');
    
    backupDb.close();
  });

  test('should provide database statistics', async () => {
    const stats = await db.getStats();
    
    expect(stats).toHaveProperty('pageCount');
    expect(stats).toHaveProperty('pageSize');
    expect(stats).toHaveProperty('freelist');
    expect(stats).toHaveProperty('schemaVersion');
    expect(stats).toHaveProperty('journalMode');
    
    expect(typeof stats.pageCount).toBe('number');
    expect(typeof stats.pageSize).toBe('number');
    expect(stats.pageCount).toBeGreaterThan(0);
    expect(stats.pageSize).toBeGreaterThan(0);
    expect(stats.schemaVersion).toBe('1.0.0');
  });
});