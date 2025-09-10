/**
 * Contract Test: mcp-tool fixed use command
 * 
 * This test defines the expected behavior of the `mcp-tool fixed use` command
 * before implementation. It must FAIL until the command is implemented.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execCommand = promisify(require('child_process').exec);

describe('mcp-tool fixed use command', () => {
  beforeEach(() => {
    // Setup clean test environment
    // This test should fail until implementation is complete
  });

  it('should execute fixed interface with parameters', async () => {
    const interfaceName = 'search_pages';
    const parameters = '{"param1": "value1", "param2": "value2"}';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} '${parameters}'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Interface executed successfully');
    expect(stdout).toContain('Response time:'); // Should show performance metrics
    expect(stderr).toBe('');
  });

  it('should fail when interface name is missing', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed use'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('interface-name is required');
  });

  it('should execute interface with no parameters', async () => {
    const interfaceName = 'no-params-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Interface executed successfully');
  });

  it('should validate JSON parameters', async () => {
    const interfaceName = 'test-interface';
    const invalidJson = 'invalid-json';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} '${invalidJson}'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Invalid JSON parameters');
  });

  it('should support parameters from file', async () => {
    const interfaceName = 'test-interface';
    const paramsFile = 'test-params.json';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --params-file ${paramsFile}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Interface executed successfully');
  });

  it('should support timeout configuration', async () => {
    const interfaceName = 'slow-interface';
    const timeout = 60; // 60 seconds
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --timeout ${timeout}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed or timeout appropriately
  });

  it('should handle timeout errors gracefully', async () => {
    const interfaceName = 'slow-interface';
    const shortTimeout = 1; // 1 second
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --timeout ${shortTimeout}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail due to timeout
    expect(stderr).toContain('Operation timed out');
    expect(stderr).toContain(`${shortTimeout} second`);
  });

  it('should support JSON output format', async () => {
    const interfaceName = 'test-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --output json`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(() => JSON.parse(stdout)).not.toThrow(); // Should be valid JSON
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('interfaceName', interfaceName);
    expect(result).toHaveProperty('responseTime');
    expect(result).toHaveProperty('data');
  });

  it('should validate response against schema', async () => {
    const interfaceName = 'validated-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --validate-response`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Response validation: passed');
  });

  it('should show validation warnings for invalid responses', async () => {
    const interfaceName = 'invalid-response-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --validate-response`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed but show warnings
    expect(stdout).toContain('Response validation: failed');
    expect(stderr).toContain('Warning: Response does not match schema');
  });

  it('should support dry-run mode', async () => {
    const interfaceName = 'test-interface';
    const parameters = '{"param1": "value1"}';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} '${parameters}' --dry-run`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Dry run - interface would be executed with');
    expect(stdout).toContain(parameters);
    expect(stdout).not.toContain('Interface executed successfully');
  });

  it('should show performance metrics', async () => {
    const interfaceName = 'test-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --show-performance`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Response time:');
    expect(stdout).toContain('ms');
    expect(stdout).toMatch(/Success: (true|false)/);
  });

  it('should fail when interface does not exist', async () => {
    const interfaceName = 'non-existent-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Fixed interface not found');
    expect(stderr).toContain(interfaceName);
  });

  it('should fail when interface is inactive', async () => {
    const interfaceName = 'inactive-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Interface is inactive');
    expect(stderr).toContain(interfaceName);
  });

  it('should support force execution of inactive interfaces', async () => {
    const interfaceName = 'inactive-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --force`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Warning: Executing inactive interface');
    expect(stdout).toContain('Interface executed successfully');
  });
});

/**
 * Error Handling and Recovery
 */
describe('mcp-tool fixed use error handling', () => {
  it('should handle MCP tool connection errors', async () => {
    const interfaceName = 'unreachable-tool-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Failed to connect to MCP tool');
  });

  it('should handle authentication errors', async () => {
    const interfaceName = 'auth-required-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Authentication required');
    expect(stderr).toContain('mcp-tool fixed auth');
  });

  it('should handle parameter validation errors', async () => {
    const interfaceName = 'strict-validation-interface';
    const invalidParams = '{"invalidParam": "value"}';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} '${invalidParams}'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Parameter validation failed');
    expect(stderr).toContain('invalidParam');
  });

  it('should provide helpful error suggestions', async () => {
    const interfaceName = 'test-interface';
    const incompleteParams = '{"param1": "value1"}'; // Missing required param2
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} '${incompleteParams}'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Missing required parameter: param2');
    expect(stderr).toContain('Use --help to see parameter requirements');
  });

  it('should save execution history for debugging', async () => {
    const interfaceName = 'test-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed use ${interfaceName} --save-history`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Execution saved to history');
  });
});