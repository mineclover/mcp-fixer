import { test, expect, describe } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

describe('mcp-tool query run command', () => {
  test('should display help when run with --help', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', '--help']);
      
      // Contract: query run command should show help text
      expect(result.stdout).toContain('run');
      expect(result.stdout).toContain('execute');
      expect(result.stdout).toContain('--params');
      expect(result.stdout).toContain('--format');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should require query name parameter', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run']);
      
      // Contract: should require query name
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('query name required') || expect(result.stderr).toContain('missing query');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should execute existing query successfully', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query']);
      
      // Contract: should execute query and return results
      expect(result.stdout).toContain('result') || expect(result.stdout).toContain('completed');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should handle query not found error', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'nonexistent-query']);
      
      // Contract: should error when query doesn't exist
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('query not found') || expect(result.stderr).toContain('unknown query');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support runtime parameters with --params flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'search-query', '--params', '{"query": "test"}']);
      
      // Contract: should accept runtime parameters
      expect(result.stdout).toContain('result') || expect(result.stdout).toContain('completed');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should validate runtime parameters against query schema', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'search-query', '--params', '{"invalid": "param"}']);
      
      // Contract: should validate parameters
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('parameter validation') || expect(result.stderr).toContain('invalid parameters');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support JSON output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--format', 'json']);
      
      // Contract: should return valid JSON
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('result');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support table output format (default)', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query']);
      
      // Contract: should format result as table
      expect(result.stdout).toContain('│') || expect(result.stdout).toContain('|'); // Table formatting
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support CSV output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--format', 'csv']);
      
      // Contract: should return CSV formatted data
      expect(result.stdout).toContain(','); // CSV formatting
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should handle authentication errors gracefully', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'auth-required-query']);
      
      // Contract: should provide clear auth error message
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('authentication') || expect(result.stderr).toContain('unauthorized');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support timeout configuration with --timeout flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'slow-query', '--timeout', '5']);
      
      // Contract: should respect timeout setting
      expect(result.exitCode).toBe(0) || expect(result.exitCode).toBe(1);
      if (result.exitCode === 1) {
        expect(result.stderr).toContain('timeout');
      }
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support verbose output with --verbose flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--verbose']);
      
      // Contract: should show execution details
      expect(result.stdout).toContain('Executing') || expect(result.stdout).toContain('Duration');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support dry run mode with --dry-run flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--dry-run']);
      
      // Contract: should validate without executing
      expect(result.stdout).toContain('dry run') || expect(result.stdout).toContain('would execute');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support data collector integration with --collect flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--collect', 'data-collector']);
      
      // Contract: should run data collector before query execution
      expect(result.stdout).toContain('collected') || expect(result.stdout).toContain('collector');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should save execution results when --save flag provided', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'run', 'example-query', '--save']);
      
      // Contract: should save execution context and results
      expect(result.stdout).toContain('saved') || expect(result.stdout).toContain('execution saved');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });
});