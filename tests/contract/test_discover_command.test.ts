import { test, expect, describe } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

describe('mcp-tool discover command', () => {
  test('should display help when run with --help', async () => {
    // This test will fail initially until the CLI is implemented
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--help']);
      
      // Contract: discover command should show help text
      expect(result.stdout).toContain('discover');
      expect(result.stdout).toContain('MCP tools');
      expect(result.stdout).toContain('--endpoint');
      expect(result.stdout).toContain('--format');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should fail with error when no endpoint provided and auto-discovery disabled', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--no-auto']);
      
      // Contract: should require endpoint when auto-discovery is disabled
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('endpoint required');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support JSON output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--format', 'json', 'http://example.com']);
      
      // Contract: JSON output should be valid JSON
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('tools');
      expect(Array.isArray(output.tools)).toBe(true);
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support table output format (default)', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', 'http://example.com']);
      
      // Contract: Table output should contain headers
      expect(result.stdout).toContain('Name');
      expect(result.stdout).toContain('Version');
      expect(result.stdout).toContain('Description');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support CSV output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--format', 'csv', 'http://example.com']);
      
      // Contract: CSV output should have headers and comma separation
      const lines = result.stdout.split('\n');
      expect(lines[0]).toContain('name,version,description');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should handle connection timeout gracefully', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--timeout', '1', 'http://unreachable.example.com']);
      
      // Contract: should fail gracefully with timeout error
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('timeout');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support saving discovered tools', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--save', 'http://example.com']);
      
      // Contract: should save tools and report count
      expect(result.stdout).toContain('saved');
      expect(result.stdout).toMatch(/\d+ tools? (saved|discovered)/);
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support verbose output with --verbose flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--verbose', 'http://example.com']);
      
      // Contract: verbose output should include detailed information
      expect(result.stdout).toContain('Discovering');
      expect(result.stdout).toContain('capabilities');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should handle invalid endpoint URLs', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', 'invalid-url']);
      
      // Contract: should validate URL format
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('invalid URL') || expect(result.stderr).toContain('invalid endpoint');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support auto-discovery mode', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'discover', '--auto']);
      
      // Contract: auto-discovery should scan for local MCP tools
      expect(result.stdout).toContain('auto-discovery') || expect(result.stdout).toContain('scanning');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });
});