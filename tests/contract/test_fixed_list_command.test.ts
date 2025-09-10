/**
 * Contract Test: mcp-tool fixed list command
 * 
 * This test defines the expected behavior of the `mcp-tool fixed list` command
 * before implementation. It must FAIL until the command is implemented.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { exec } from 'child_process';

function execCommand(command: string): Promise<{stdout: string, stderr: string, code: number}> {
  return new Promise((resolve) => {
    exec(command, { env: { ...process.env, DB_PATH: './data/mcp-tool.db' } }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (error as any).code || 1 : 0
      });
    });
  });
}

describe('mcp-tool fixed list command', () => {
  beforeEach(() => {
    // Setup clean test environment
    // This test should fail until implementation is complete
  });

  it('should list all fixed interfaces', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list'
    );

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toMatch(/Fixed Interfaces/); // Should have header
    expect(stdout).toMatch(/ID\s+Name\s+Tool\s+Version\s+Status/); // Should have column headers
  });

  it('should list fixed interfaces for specific tool', async () => {
    const toolId = 'notion-mcp'; // Use existing tool from sample data
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed list ${toolId}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(toolId);
  });

  it('should support JSON output format', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --output json'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(() => JSON.parse(stdout)).not.toThrow(); // Should be valid JSON
    
    const result = JSON.parse(stdout);
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('toolId');
      expect(result[0]).toHaveProperty('version');
      expect(result[0]).toHaveProperty('isActive');
    }
  });

  it('should support CSV output format', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --output csv'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('id,name,toolId,displayName,version,isActive'); // CSV headers
  });

  it('should filter by active status', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --active'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should only show active interfaces (implementation detail)
  });

  it('should filter by inactive status', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --inactive'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should only show inactive interfaces (implementation detail)
  });

  it('should support filtering by name pattern', async () => {
    const pattern = 'test-*';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed list --name "${pattern}"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should filter results by name pattern
  });

  it('should support filtering by version', async () => {
    const version = '1.0.0';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed list --version "${version}"`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should filter results by version
  });

  it('should support sorting options', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --sort name'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should sort results by name
  });

  it('should support reverse sorting', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --sort name --reverse'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should sort results by name in reverse order
  });

  it('should show detailed view with --detail flag', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --detail'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Description'); // Should show additional details
    expect(stdout).toContain('Created'); // Should show timestamps
    expect(stdout).toContain('Last Validated'); // Should show validation info
  });

  it('should support pagination', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --limit 10 --offset 0'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should limit results to 10 items starting from offset 0
  });

  it('should show statistics with --stats flag', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --stats'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Total interfaces:');
    expect(stdout).toContain('Active interfaces:');
    expect(stdout).toContain('Performance summary:');
  });

  it('should handle empty results gracefully', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list non-existent-tool'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed even with no results
    expect(stdout).toContain('No fixed interfaces found');
  });

  it('should show performance metrics with --performance flag', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --performance'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Avg Response Time'); // Should show performance columns
    expect(stdout).toContain('Success Rate'); // Should show success rate
    expect(stdout).toContain('Last 7 days'); // Should indicate time period
  });
});

/**
 * Integration and Advanced Features
 */
describe('mcp-tool fixed list advanced features', () => {
  it('should support multiple filters combined', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --active --name "api-*" --version "1.*" --sort name'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    // Should apply all filters and sorting
  });

  it('should validate tool exists when tool-id provided', async () => {
    const toolId = 'non-existent-tool';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed list ${toolId} --validate-tool`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Tool not found');
    expect(stderr).toContain(toolId);
  });

  it('should show validation status indicators', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed list --show-validation'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toMatch(/✓|✗|⚠/); // Should show validation status icons
  });

  it('should export results to file', async () => {
    const outputFile = 'test-interfaces.json';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed list --output json --export ${outputFile}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Results exported to ${outputFile}`);
  });
});