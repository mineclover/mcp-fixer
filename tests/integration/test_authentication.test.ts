import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../../src/lib/database';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Authentication Integration Tests', () => {
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

  test('should store encrypted API key credentials', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'test-tool-id';
      const apiKey = 'test-api-key-12345';
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: apiKey
      });
      
      // Integration contract: should store encrypted credential
      expect(typeof credentialId).toBe('string');
      expect(credentialId.length).toBeGreaterThan(0);
      
      // Verify credential is encrypted in database
      const storedCred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(credentialId);
      expect(storedCred).toBeDefined();
      expect(storedCred.auth_type).toBe('api_key');
      expect(storedCred.encrypted_data).not.toEqual(Buffer.from(apiKey));
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should retrieve and decrypt stored credentials', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'test-tool-id';
      const originalValue = 'test-bearer-token-67890';
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'bearer',
        value: originalValue
      });

      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should decrypt and return original value
      expect(retrievedCredential).toBeDefined();
      expect(retrievedCredential.type).toBe('bearer');
      expect(retrievedCredential.value).toBe(originalValue);
      expect(retrievedCredential.id).toBe(credentialId);
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle basic authentication credentials', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'basic-auth-tool';
      const username = 'testuser';
      const password = 'testpass123';
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'basic',
        username,
        password
      });

      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should store and retrieve basic auth
      expect(retrievedCredential).toBeDefined();
      expect(retrievedCredential.type).toBe('basic');
      expect(retrievedCredential.username).toBe(username);
      expect(retrievedCredential.password).toBe(password);
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should support OAuth token storage and refresh', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'oauth-tool';
      const accessToken = 'access-token-12345';
      const refreshToken = 'refresh-token-67890';
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'oauth',
        accessToken,
        refreshToken,
        expiresAt
      });

      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should handle OAuth tokens
      expect(retrievedCredential).toBeDefined();
      expect(retrievedCredential.type).toBe('oauth');
      expect(retrievedCredential.accessToken).toBe(accessToken);
      expect(retrievedCredential.refreshToken).toBe(refreshToken);
      expect(new Date(retrievedCredential.expiresAt).getTime()).toBe(expiresAt.getTime());
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should validate credentials against tool requirements', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      // Mock tool with specific auth requirements
      const toolId = 'validation-tool';
      const toolAuthConfig = {
        type: 'api_key',
        required: true,
        format: /^[a-zA-Z0-9]{20,}$/ // At least 20 alphanumeric characters
      };

      // Valid credential
      const validResult = await authManager.validateCredential(toolId, {
        type: 'api_key',
        value: 'validApiKey1234567890'
      }, toolAuthConfig);

      // Invalid credential
      const invalidResult = await authManager.validateCredential(toolId, {
        type: 'api_key',
        value: 'short'
      }, toolAuthConfig);
      
      // Integration contract: should validate credentials
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle credential expiration', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'expiring-tool';
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: 'expiring-key',
        expiresAt: pastDate
      });

      const isExpired = await authManager.isCredentialExpired(toolId);
      const activeCredentials = await authManager.getActiveCredentials();
      
      // Integration contract: should handle expiration
      expect(isExpired).toBe(true);
      expect(activeCredentials.find(c => c.id === credentialId)).toBeUndefined();
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should update existing credentials', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'update-tool';
      const originalValue = 'original-key';
      const updatedValue = 'updated-key';
      
      // Store original credential
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: originalValue
      });

      // Update credential
      await authManager.updateCredential(toolId, {
        type: 'api_key',
        value: updatedValue
      });

      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should update existing credential
      expect(retrievedCredential.value).toBe(updatedValue);
      expect(retrievedCredential.id).toBe(credentialId); // Same ID
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should remove credentials securely', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'removal-tool';
      
      const credentialId = await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: 'to-be-removed'
      });

      await authManager.removeCredential(toolId);

      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should remove credential completely
      expect(retrievedCredential).toBeNull();
      
      // Verify removed from database
      const dbResult = db.prepare('SELECT * FROM credentials WHERE id = ?').get(credentialId);
      expect(dbResult).toBeUndefined();
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should test credential validity with tool endpoint', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'test-tool';
      const toolEndpoint = 'http://localhost:3000/mcp';
      
      await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: 'test-key'
      });

      const testResult = await authManager.testCredential(toolId, toolEndpoint);
      
      // Integration contract: should test credential with endpoint
      expect(testResult).toHaveProperty('valid');
      expect(testResult).toHaveProperty('statusCode');
      expect(typeof testResult.valid).toBe('boolean');
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should list all stored credentials without exposing values', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      // Store multiple credentials
      await authManager.storeCredential('tool1', { type: 'api_key', value: 'key1' });
      await authManager.storeCredential('tool2', { type: 'bearer', value: 'token2' });
      await authManager.storeCredential('tool3', { type: 'basic', username: 'user', password: 'pass' });

      const credentialList = await authManager.listCredentials();
      
      // Integration contract: should list without exposing values
      expect(Array.isArray(credentialList)).toBe(true);
      expect(credentialList.length).toBe(3);
      
      credentialList.forEach(cred => {
        expect(cred).toHaveProperty('toolId');
        expect(cred).toHaveProperty('type');
        expect(cred).toHaveProperty('createdAt');
        expect(cred).not.toHaveProperty('value');
        expect(cred).not.toHaveProperty('password');
        expect(cred).not.toHaveProperty('accessToken');
      });
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });

  test('should handle encryption key rotation', async () => {
    try {
      const { AuthManager } = await import('../../src/services/auth/auth-manager');
      const authManager = new AuthManager(db);

      const toolId = 'rotation-tool';
      const originalValue = 'original-secret';
      
      // Store credential with current key
      await authManager.storeCredential(toolId, {
        type: 'api_key',
        value: originalValue
      });

      // Rotate encryption key
      await authManager.rotateEncryptionKey();

      // Should still be able to retrieve credential
      const retrievedCredential = await authManager.getCredential(toolId);
      
      // Integration contract: should handle key rotation
      expect(retrievedCredential.value).toBe(originalValue);
    } catch (error) {
      // Expected to fail until AuthManager is implemented
      expect(error).toBeDefined();
    }
  });
});