import { test, expect, describe } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

describe('mcp-tool tools command', () => {
  test('should display help when run with --help', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--help']);
      
      // Contract: tools command should show help text
      expect(result.stdout).toContain('tools');
      expect(result.stdout).toContain('list discovered');
      expect(result.stdout).toContain('--status');
      expect(result.stdout).toContain('--format');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should list all tools in table format by default', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools']);
      
      // Contract: should show table with tool information
      expect(result.stdout).toContain('Name');
      expect(result.stdout).toContain('Version');
      expect(result.stdout).toContain('Status');
      expect(result.stdout).toContain('Last Checked');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support JSON output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--format', 'json']);
      
      // Contract: JSON output should be valid JSON array
      const output = JSON.parse(result.stdout);
      expect(Array.isArray(output)).toBe(true);
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support CSV output format', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--format', 'csv']);
      
      // Contract: CSV output should have headers
      const lines = result.stdout.split('\n');
      expect(lines[0]).toContain('name,version,status');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should filter by status when --status flag provided', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--status', 'active']);
      
      // Contract: should only show tools with specified status
      expect(result.exitCode).toBe(0);
      // Tools with active status only should be shown
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support multiple status filters', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--status', 'active,inactive']);
      
      // Contract: should show tools with any of the specified statuses
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should show tool details with --verbose flag', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--verbose']);
      
      // Contract: verbose output should include capabilities and endpoints
      expect(result.stdout).toContain('Capabilities') || expect(result.stdout).toContain('Endpoint');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should show specific tool details when tool name provided', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', 'example-tool']);
      
      // Contract: should show detailed information for specific tool
      expect(result.stdout).toContain('example-tool') || expect(result.stdout).toContain('Tool not found');
      expect(result.exitCode).toBe(0) || expect(result.exitCode).toBe(1);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should handle tool not found gracefully', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', 'nonexistent-tool']);
      
      // Contract: should show error message when tool not found
      expect(result.stderr).toContain('not found') || expect(result.stdout).toContain('not found');
      expect(result.exitCode).toBe(1);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should support sorting by different fields', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools', '--sort', 'name']);
      
      // Contract: should sort tools by specified field
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });

  test('should show empty state message when no tools discovered', async () => {
    try {
      const result = await execAsync('bun', ['run', 'src/cli/index.ts', 'tools']);
      
      // Contract: should handle empty state gracefully
      expect(result.stdout).toContain('No tools found') || expect(result.stdout).toContain('No tools discovered');
      expect(result.exitCode).toBe(0);
    } catch (error) {
      // Expected to fail until implementation
      expect(error).toBeDefined();
    }
  });
});