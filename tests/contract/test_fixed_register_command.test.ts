/**
 * Contract Test: mcp-tool fixed register command
 * 
 * This test defines the expected behavior of the `mcp-tool fixed register` command
 * before implementation. It must FAIL until the command is implemented.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execCommand = promisify(require('child_process').exec);

describe('mcp-tool fixed register command', () => {
  beforeEach(() => {
    // Setup clean test environment
    // This test should fail until implementation is complete
  });

  it('should register a fixed interface with valid tool and operation', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "Test Interface" --version "1.0.0"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Fixed interface registered successfully');
    expect(stdout).toContain(toolId);
    expect(stdout).toContain(operationName);
    expect(stderr).toBe('');
  });

  it('should fail when tool-id is missing', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed register'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('tool-id is required');
  });

  it('should fail when operation-name is missing', async () => {
    const toolId = 'test-tool-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('operation-name is required');
  });

  it('should accept optional parameters', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "Custom Interface" --description "Test interface" --version "2.0.0" --parameters '{"param1": "string"}' --response-schema '{"type": "object"}'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Fixed interface registered successfully');
    expect(stdout).toContain('Custom Interface');
    expect(stdout).toContain('2.0.0');
  });

  it('should validate JSON parameters', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --parameters 'invalid-json'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Invalid JSON in parameters');
  });

  it('should validate JSON response schema', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --response-schema 'invalid-json'`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Invalid JSON in response schema');
  });

  it('should support dry-run mode', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --dry-run`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Dry run - interface would be registered');
    expect(stdout).not.toContain('Fixed interface registered successfully');
  });

  it('should support different output formats', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --output json`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(() => JSON.parse(stdout)).not.toThrow(); // Should be valid JSON
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('interfaceId');
    expect(result).toHaveProperty('toolId', toolId);
    expect(result).toHaveProperty('operationName', operationName);
  });

  it('should fail gracefully when tool does not exist', async () => {
    const toolId = 'non-existent-tool-id';
    const operationName = 'test-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Tool not found');
    expect(stderr).toContain(toolId);
  });

  it('should prevent duplicate interface registration', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'duplicate-operation';
    
    // First registration should succeed (this will fail until implemented)
    await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "First Interface"`
    ).catch(() => {});
    
    // Second registration should fail
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "Second Interface"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Interface already exists');
    expect(stderr).toContain(operationName);
  });

  it('should support force flag to overwrite existing interfaces', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'overwrite-operation';
    
    // First registration
    await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "Original Interface"`
    ).catch(() => {});
    
    // Second registration with force flag should succeed
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --name "Updated Interface" --force`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Fixed interface updated successfully');
    expect(stdout).toContain('Updated Interface');
  });
});

/**
 * Integration with MCP Tool Discovery
 */
describe('mcp-tool fixed register integration', () => {
  it('should auto-discover operation schema from MCP tool', async () => {
    const toolId = 'auto-discover-tool';
    const operationName = 'discovered-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --auto-discover`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Schema auto-discovered from MCP tool');
    expect(stdout).toContain('Fixed interface registered successfully');
  });

  it('should validate operation exists on the MCP tool', async () => {
    const toolId = 'test-tool-id';
    const operationName = 'non-existent-operation';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed register ${toolId} ${operationName} --validate-operation`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Operation not found on MCP tool');
    expect(stderr).toContain(operationName);
  });
});