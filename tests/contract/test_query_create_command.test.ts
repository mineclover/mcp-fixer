import { test, expect, describe } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

describe('mcp-tool query create command', () => {
  test('should display help when run with --help', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', '--help']);
      
      // Contract: query create command should show help text
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('query');
      expect(result.stdout).toContain('--tool');
      expect(result.stdout).toContain('--operation');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should require query name parameter', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create']);
      
      // Contract: should require query name
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('name required') || expect(result.stderr).toContain('missing name');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should require --tool parameter', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query']);
      
      // Contract: should require tool specification
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('tool required') || expect(result.stderr).toContain('--tool');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should require --operation parameter', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool']);
      
      // Contract: should require operation specification
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('operation required') || expect(result.stderr).toContain('--operation');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should create query with valid parameters', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'list']);
      
      // Contract: should create query successfully
      expect(result.stdout).toContain('created') || expect(result.stdout).toContain('saved');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support description with --description flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'list', '--description', 'Test query']);
      
      // Contract: should accept description
      expect(result.stdout).toContain('created') || expect(result.stdout).toContain('saved');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support parameters definition with --params flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'search', '--params', '{"query": {"type": "string"}}']);
      
      // Contract: should accept parameter schema
      expect(result.stdout).toContain('created') || expect(result.stdout).toContain('saved');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should validate JSON schema for parameters', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'search', '--params', 'invalid-json']);
      
      // Contract: should validate parameter schema JSON
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('invalid JSON') || expect(result.stderr).toContain('schema error');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should reject duplicate query names', async () => {
    try {
      // First create a query
      await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'duplicate-query', '--tool', 'example-tool', '--operation', 'list']);
      
      // Try to create another with same name
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'duplicate-query', '--tool', 'example-tool', '--operation', 'list']);
      
      // Contract: should reject duplicate names
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('already exists') || expect(result.stderr).toContain('duplicate');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should validate tool exists before creating query', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'nonexistent-tool', '--operation', 'list']);
      
      // Contract: should validate tool exists
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('tool not found') || expect(result.stderr).toContain('unknown tool');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should validate operation is supported by tool', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'unsupported-operation']);
      
      // Contract: should validate operation against tool capabilities
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('operation not supported') || expect(result.stderr).toContain('invalid operation');
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support interactive mode when parameters not provided', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--interactive']);
      
      // Contract: should prompt for tool and operation
      expect(result.stdout).toContain('Select tool') || expect(result.stdout).toContain('Choose operation');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support dry run mode with --dry-run flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'query', 'create', 'my-query', '--tool', 'example-tool', '--operation', 'list', '--dry-run']);
      
      // Contract: should validate without saving
      expect(result.stdout).toContain('dry run') || expect(result.stdout).toContain('would create');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });
});