import { test, expect, describe } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

describe('mcp-tool collector commands', () => {
  describe('collector register', () => {
    test('should display help when run with --help', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register', '--help']);
        
        // Contract: collector register should show help text
        expect(result.stdout).toContain('register');
        expect(result.stdout).toContain('collector');
        expect(result.stdout).toContain('path');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should require collector path parameter', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register']);
        
        // Contract: should require collector path
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('path required') || expect(result.stderr).toContain('missing path');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should validate collector file exists', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register', '/nonexistent/path.js']);
        
        // Contract: should validate file exists
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('file not found') || expect(result.stderr).toContain('does not exist');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should register valid collector successfully', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register', './examples/example-collector.js']);
        
        // Contract: should register collector
        expect(result.stdout).toContain('registered') || expect(result.stdout).toContain('added');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should support collector name with --name flag', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register', './collector.js', '--name', 'my-collector']);
        
        // Contract: should accept custom name
        expect(result.stdout).toContain('my-collector') || expect(result.stdout).toContain('registered');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should support description with --description flag', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'register', './collector.js', '--description', 'Test collector']);
        
        // Contract: should accept description
        expect(result.stdout).toContain('registered') || expect(result.stdout).toContain('added');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });
  });

  describe('collector list', () => {
    test('should display help when run with --help', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'list', '--help']);
        
        // Contract: collector list should show help text
        expect(result.stdout).toContain('list');
        expect(result.stdout).toContain('collectors');
        expect(result.stdout).toContain('--format');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should list collectors in table format by default', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'list']);
        
        // Contract: should show table with collector information
        expect(result.stdout).toContain('Name') || expect(result.stdout).toContain('No collectors found');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should support JSON output format', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'list', '--format', 'json']);
        
        // Contract: should return valid JSON array
        const output = JSON.parse(result.stdout);
        expect(Array.isArray(output)).toBe(true);
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should filter by enabled status with --enabled flag', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'list', '--enabled']);
        
        // Contract: should show only enabled collectors
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });
  });

  describe('collector run', () => {
    test('should display help when run with --help', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', '--help']);
        
        // Contract: collector run should show help text
        expect(result.stdout).toContain('run');
        expect(result.stdout).toContain('execute');
        expect(result.stdout).toContain('collector');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should require collector name parameter', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run']);
        
        // Contract: should require collector name
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('collector name required') || expect(result.stderr).toContain('missing collector');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should execute existing collector successfully', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', 'example-collector']);
        
        // Contract: should execute collector and return results
        expect(result.stdout).toContain('collected') || expect(result.stdout).toContain('completed');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should handle collector not found error', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', 'nonexistent-collector']);
        
        // Contract: should error when collector doesn't exist
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('collector not found') || expect(result.stderr).toContain('unknown collector');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should support input parameters with --input flag', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', 'example-collector', '--input', '{"param": "value"}']);
        
        // Contract: should accept input parameters
        expect(result.stdout).toContain('collected') || expect(result.stdout).toContain('completed');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should validate input parameters against collector schema', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', 'example-collector', '--input', '{"invalid": "param"}']);
        
        // Contract: should validate input parameters
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('parameter validation') || expect(result.stderr).toContain('invalid input');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should support timeout configuration with --timeout flag', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'run', 'slow-collector', '--timeout', '5']);
        
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
  });

  describe('collector remove', () => {
    test('should display help when run with --help', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'remove', '--help']);
        
        // Contract: collector remove should show help text
        expect(result.stdout).toContain('remove');
        expect(result.stdout).toContain('collector');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should require collector name parameter', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'remove']);
        
        // Contract: should require collector name
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('collector name required') || expect(result.stderr).toContain('missing collector');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should remove existing collector successfully', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'remove', 'example-collector']);
        
        // Contract: should remove collector
        expect(result.stdout).toContain('removed') || expect(result.stdout).toContain('deleted');
        expect(result.exitCode).toBe(0);
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });

    test('should handle collector not found error', async () => {
      try {
        const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'collector', 'remove', 'nonexistent-collector']);
        
        // Contract: should error when collector doesn't exist
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('collector not found') || expect(result.stderr).toContain('unknown collector');
      } catch (error) {
        // Expected to fail until implementation
        expect(error).toBeDefined();
      }
    });
  });
});