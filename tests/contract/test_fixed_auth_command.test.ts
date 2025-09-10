/**
 * Contract Test: mcp-tool fixed auth command
 * 
 * This test defines the expected behavior of the `mcp-tool fixed auth` command
 * before implementation. It must FAIL until the command is implemented.
 * 
 * ⚠️ MANUAL INTERVENTION REQUIRED: OAuth flows require browser authentication
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execCommand = promisify(require('child_process').exec);

describe('mcp-tool fixed auth command', () => {
  beforeEach(() => {
    // Setup clean test environment
    // This test should fail until implementation is complete
  });

  it('should display authentication status for a tool', async () => {
    const toolId = 'test-tool-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Authentication status for ${toolId}:`);
    expect(stdout).toMatch(/(Authenticated|Not authenticated|Authentication required)/);
  });

  it('should fail when tool-id is missing', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed auth'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('tool-id is required');
  });

  it('should initiate OAuth flow for supported providers', async () => {
    const toolId = 'notion-tool-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    // ⚠️ MANUAL: This will pause execution when browser redirect occurs
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Initiating OAuth flow for');
    expect(stdout).toContain('Opening browser for authentication');
    expect(stdout).toContain('Waiting for authorization code');
    
    // The command should pause here for manual browser authentication
    // Test will fail until manual intervention capability is implemented
  });

  it('should handle OAuth callback with authorization code', async () => {
    const toolId = 'oauth-tool-id';
    const authCode = 'test-authorization-code';
    const state = 'test-state';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --callback --code ${authCode} --state ${state}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Processing OAuth callback');
    expect(stdout).toContain('Authentication successful');
    expect(stdout).toContain('Access token saved');
  });

  it('should refresh expired OAuth tokens', async () => {
    const toolId = 'oauth-tool-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --refresh`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Refreshing OAuth token');
    expect(stdout).toContain('Token refreshed successfully');
  });

  it('should handle refresh token expiration', async () => {
    const toolId = 'expired-refresh-token-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --refresh`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Refresh token expired');
    expect(stderr).toContain('Please re-authenticate using --login');
  });

  it('should configure OAuth provider settings', async () => {
    const toolId = 'custom-oauth-tool';
    const clientId = 'custom-client-id';
    const authUrl = 'https://custom.provider.com/oauth/authorize';
    const tokenUrl = 'https://custom.provider.com/oauth/token';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --configure --client-id ${clientId} --auth-url "${authUrl}" --token-url "${tokenUrl}"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('OAuth configuration saved');
    expect(stdout).toContain(clientId);
  });

  it('should validate OAuth configuration', async () => {
    const toolId = 'validation-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --validate`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Validating OAuth configuration');
    expect(stdout).toMatch(/(Configuration valid|Configuration invalid)/);
  });

  it('should support predefined OAuth providers', async () => {
    const toolId = 'notion-tool';
    const provider = 'notion';
    const clientId = 'notion-client-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --setup-provider ${provider} --client-id ${clientId}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Setting up ${provider} OAuth provider`);
    expect(stdout).toContain('Provider configuration saved');
  });

  it('should logout and remove stored credentials', async () => {
    const toolId = 'logout-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --logout`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Logging out');
    expect(stdout).toContain('Credentials removed');
  });

  it('should test authentication without making changes', async () => {
    const toolId = 'test-auth-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --test`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Testing authentication');
    expect(stdout).toMatch(/(Authentication successful|Authentication failed)/);
  });

  it('should support JSON output format', async () => {
    const toolId = 'json-output-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --output json`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(() => JSON.parse(stdout)).not.toThrow(); // Should be valid JSON
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('toolId', toolId);
    expect(result).toHaveProperty('authenticated');
    expect(result).toHaveProperty('provider');
  });

  it('should handle OAuth errors gracefully', async () => {
    const toolId = 'error-tool';
    const invalidCode = 'invalid-auth-code';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --callback --code ${invalidCode}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('OAuth error');
    expect(stderr).toContain('invalid_grant');
  });

  it('should show token expiration information', async () => {
    const toolId = 'expiry-info-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --show-expiry`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Token expiry information:');
    expect(stdout).toMatch(/(Expires in|Expired|No expiration)/);
  });
});

/**
 * Manual Intervention and Browser Integration Tests
 * ⚠️ These tests require coordinated human interaction
 */
describe('mcp-tool fixed auth manual intervention', () => {
  it('should detect when OAuth flow requires browser redirect', async () => {
    const toolId = 'notion-manual-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login --detect-manual`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    // Command should detect browser redirect requirement and pause
    expect(stdout).toContain('Browser authentication required');
    expect(stdout).toContain('MANUAL INTERVENTION NEEDED');
    expect(stdout).toContain('Press Enter after completing authentication');
    
    // The implementation should pause here and wait for user input
    // This is the critical requirement from the task specification
  });

  it('should provide clear instructions for manual authentication', async () => {
    const toolId = 'manual-auth-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login --manual-mode`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(stdout).toContain('Manual authentication mode');
    expect(stdout).toContain('1. Open the following URL in your browser:');
    expect(stdout).toContain('2. Complete the authentication process');
    expect(stdout).toContain('3. Copy the authorization code');
    expect(stdout).toContain('4. Run the callback command with the code');
  });

  it('should resume after manual OAuth completion', async () => {
    const toolId = 'resume-auth-tool';
    const authCode = 'manually-obtained-code';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --resume --code ${authCode}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Resuming OAuth flow');
    expect(stdout).toContain('Manual authentication completed');
    expect(stdout).toContain('Authentication successful');
  });

  it('should timeout gracefully if manual intervention takes too long', async () => {
    const toolId = 'timeout-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login --manual-timeout 5`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail due to timeout
    expect(stderr).toContain('Manual authentication timeout');
    expect(stderr).toContain('Please try again or use manual mode');
  });

  it('should save partial OAuth state for later completion', async () => {
    const toolId = 'partial-state-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login --save-state`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(stdout).toContain('OAuth state saved');
    expect(stdout).toContain('Use --resume to continue authentication');
    expect(stdout).toContain('State ID:'); // Should provide state identifier
  });
});

/**
 * Security and Error Recovery Tests
 */
describe('mcp-tool fixed auth security', () => {
  it('should encrypt stored OAuth tokens', async () => {
    const toolId = 'encryption-test-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --show-encryption-info`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Token encryption: enabled');
    expect(stdout).toContain('Encryption algorithm: AES-256');
  });

  it('should validate OAuth provider URLs for security', async () => {
    const toolId = 'security-validation-tool';
    const unsafeUrl = 'http://unsafe.provider.com/oauth'; // HTTP instead of HTTPS
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --configure --auth-url "${unsafeUrl}"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('OAuth URLs must use HTTPS');
    expect(stderr).toContain('Insecure URL rejected');
  });

  it('should implement PKCE for OAuth security', async () => {
    const toolId = 'pkce-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed auth ${toolId} --login --enable-pkce`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('PKCE enabled');
    expect(stdout).toContain('Code challenge generated');
  });
});