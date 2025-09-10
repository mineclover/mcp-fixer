/**
 * Contract Test: mcp-tool fixed stats command
 * 
 * This test defines the expected behavior of the `mcp-tool fixed stats` command
 * before implementation. It must FAIL until the command is implemented.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execCommand = promisify(require('child_process').exec);

describe('mcp-tool fixed stats command', () => {
  beforeEach(() => {
    // Setup clean test environment
    // This test should fail until implementation is complete
  });

  it('should show stats for a specific interface', async () => {
    const interfaceName = 'test-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Statistics for interface: ${interfaceName}`);
    expect(stdout).toContain('Total calls:');
    expect(stdout).toContain('Average response time:');
    expect(stdout).toContain('Success rate:');
  });

  it('should show global fixed interface statistics', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed stats'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Fixed Interface Statistics');
    expect(stdout).toContain('Total interfaces:');
    expect(stdout).toContain('Active interfaces:');
    expect(stdout).toContain('Overall performance:');
  });

  it('should show performance comparison with dynamic discovery', async () => {
    const interfaceName = 'comparison-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --compare`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Performance Comparison');
    expect(stdout).toContain('Fixed interface:');
    expect(stdout).toContain('Dynamic discovery:');
    expect(stdout).toContain('Improvement:');
    expect(stdout).toMatch(/\d+% (faster|slower)/);
  });

  it('should support different time periods', async () => {
    const interfaceName = 'time-period-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --period 7d`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Last 7 days');
    expect(stdout).toContain('Period: 7 days');
  });

  it('should support hourly, daily, and weekly periods', async () => {
    const interfaceName = 'period-test-interface';
    
    // Test hourly period
    const { stdout: hourlyOutput, code: hourlyCode } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --period 24h`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    expect(hourlyCode).toBe(0);
    expect(hourlyOutput).toContain('Last 24 hours');

    // Test daily period
    const { stdout: dailyOutput, code: dailyCode } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --period 30d`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    expect(dailyCode).toBe(0);
    expect(dailyOutput).toContain('Last 30 days');
  });

  it('should show detailed performance metrics', async () => {
    const interfaceName = 'detailed-stats-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --detailed`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Detailed Performance Metrics');
    expect(stdout).toContain('Min response time:');
    expect(stdout).toContain('Max response time:');
    expect(stdout).toContain('Median response time:');
    expect(stdout).toContain('95th percentile:');
    expect(stdout).toContain('99th percentile:');
  });

  it('should show error breakdown', async () => {
    const interfaceName = 'error-stats-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --errors`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Error Breakdown');
    expect(stdout).toContain('Authentication errors:');
    expect(stdout).toContain('Network errors:');
    expect(stdout).toContain('Validation errors:');
    expect(stdout).toContain('Server errors:');
    expect(stdout).toContain('Timeout errors:');
  });

  it('should support JSON output format', async () => {
    const interfaceName = 'json-stats-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --output json`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(() => JSON.parse(stdout)).not.toThrow(); // Should be valid JSON
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('interfaceName', interfaceName);
    expect(result).toHaveProperty('totalCalls');
    expect(result).toHaveProperty('averageResponseTime');
    expect(result).toHaveProperty('successRate');
    expect(result).toHaveProperty('period');
  });

  it('should generate trend data', async () => {
    const interfaceName = 'trend-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --trend`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Performance Trend');
    expect(stdout).toMatch(/\d{4}-\d{2}-\d{2}/); // Should show dates
    expect(stdout).toContain('Response Time Trend:');
    expect(stdout).toContain('Success Rate Trend:');
  });

  it('should export statistics to CSV', async () => {
    const interfaceName = 'csv-export-interface';
    const csvFile = 'stats-export.csv';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --export-csv ${csvFile}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Statistics exported to ${csvFile}`);
  });

  it('should show statistics for multiple interfaces', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed stats --all'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('All Interface Statistics');
    expect(stdout).toMatch(/Interface\s+Calls\s+Avg Response\s+Success Rate/);
  });

  it('should filter statistics by tool', async () => {
    const toolId = 'filter-tool-id';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats --tool ${toolId}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Statistics for tool: ${toolId}`);
  });

  it('should show performance threshold compliance', async () => {
    const interfaceName = 'threshold-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --thresholds`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Threshold Compliance');
    expect(stdout).toContain('Target response time: <100ms');
    expect(stdout).toContain('Target success rate: >95%');
    expect(stdout).toMatch(/(MEETS|FAILS) threshold requirements/);
  });

  it('should fail when interface does not exist', async () => {
    const interfaceName = 'non-existent-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(1); // Command should fail
    expect(stderr).toContain('Fixed interface not found');
    expect(stderr).toContain(interfaceName);
  });

  it('should handle no data gracefully', async () => {
    const interfaceName = 'no-data-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('No performance data available');
    expect(stdout).toContain('Try executing the interface to generate statistics');
  });
});

/**
 * Advanced Analytics and Reporting
 */
describe('mcp-tool fixed stats advanced analytics', () => {
  it('should generate performance benchmarks', async () => {
    const interfaceName = 'benchmark-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --benchmark`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Performance Benchmark');
    expect(stdout).toContain('Running benchmark tests...');
    expect(stdout).toContain('Benchmark completed');
    expect(stdout).toContain('Average: ');
    expect(stdout).toMatch(/\d+(\.\d+)? operations\/second/);
  });

  it('should compare statistics across time periods', async () => {
    const interfaceName = 'time-comparison-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --compare-periods --period1 7d --period2 30d`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Period Comparison');
    expect(stdout).toContain('Last 7 days vs Last 30 days');
    expect(stdout).toMatch(/(improved|degraded|stable)/);
  });

  it('should show statistical significance', async () => {
    const interfaceName = 'significance-test-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --statistical-significance`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Statistical Analysis');
    expect(stdout).toContain('Sample size:');
    expect(stdout).toContain('Confidence interval:');
    expect(stdout).toContain('Statistical significance:');
  });

  it('should generate performance alerts', async () => {
    const interfaceName = 'alert-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --alerts`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Performance Alerts');
    // May show alerts or "No alerts" depending on data
  });

  it('should show usage patterns and hotspots', async () => {
    const { stdout, stderr, code } = await execCommand(
      'bun run src/cli/index.ts fixed stats --usage-patterns'
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Usage Patterns');
    expect(stdout).toContain('Most active interfaces:');
    expect(stdout).toContain('Peak usage times:');
    expect(stdout).toContain('Least used interfaces:');
  });

  it('should generate comprehensive performance report', async () => {
    const reportFile = 'performance-report.html';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats --generate-report ${reportFile}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`Performance report generated: ${reportFile}`);
    expect(stdout).toContain('Report includes:');
    expect(stdout).toContain('- Performance metrics');
    expect(stdout).toContain('- Trend analysis');
    expect(stdout).toContain('- Error breakdown');
  });

  it('should support custom date ranges', async () => {
    const interfaceName = 'custom-range-interface';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --from ${startDate} --to ${endDate}`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain(`From: ${startDate}`);
    expect(stdout).toContain(`To: ${endDate}`);
  });

  it('should validate performance targets and show compliance score', async () => {
    const interfaceName = 'compliance-interface';
    
    const { stdout, stderr, code } = await execCommand(
      `bun run src/cli/index.ts fixed stats ${interfaceName} --compliance-score`
    ).catch((error: any) => ({ stdout: '', stderr: error.message, code: 1 }));

    // Expected contract behavior:
    expect(code).toBe(0); // Command should succeed
    expect(stdout).toContain('Performance Compliance Score:');
    expect(stdout).toMatch(/\d+\/100/); // Should show score out of 100
    expect(stdout).toContain('Target achievement:');
  });
});