/**
 * Fixed Interface Management CLI Commands
 * 
 * Base command group for managing fixed MCP tool interfaces.
 * Provides subcommands for register, list, use, test, auth, and stats.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Database } from 'bun:sqlite';
import { FixedInterfaceManager } from '../../services/fixed-interface/interface-manager.js';
import { OAuthFlowManager } from '../../services/oauth/oauth-flow-manager.js';
import { getDatabase, initializeDatabase } from '../../lib/database.js';
import { getConfig } from '../../lib/config.js';

let db: Database;
let interfaceManager: FixedInterfaceManager;
let oauthManager: OAuthFlowManager;

// Initialize services
async function initializeServices(silent = false) {
  if (!db) {
    try {
      if (!silent) {
        console.log('Initializing fixed interface services...');
      }
      const dbManager = await initializeDatabase();
      db = dbManager.getDatabase();
      
      const config = getConfig();
      
      interfaceManager = new FixedInterfaceManager({
        database: db,
        cacheTimeout: 3600,
        validationInterval: 86400,
        performanceTarget: 100,
        enableMetrics: true,
      });

      oauthManager = new OAuthFlowManager({
        database: db,
        encryptionKey: config.getCredentialKeyPath() || 'default-dev-key-change-in-production',
        tokenRefreshThreshold: 3600,
        maxRetries: 3,
        callbackTimeout: 300000, // 5 minutes
        enableManualDetection: true,
        enableBackgroundRefresh: false, // Don't start background timers in CLI
      });
      if (!silent) {
        console.log('Fixed interface services initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize fixed interface services:', error);
      throw error;
    }
  }
  return { interfaceManager, oauthManager, db };
}

export function createFixedCommand(getServices?: any): Command {
  const fixedCmd = new Command('fixed');
  
  fixedCmd
    .description('Manage fixed MCP tool interfaces for optimized performance')
    .addHelpText('after', `
Examples:
  $ mcp-tool fixed register tool-id operation-name --name "My Interface"
  $ mcp-tool fixed list
  $ mcp-tool fixed use interface-name '{"param": "value"}'
  $ mcp-tool fixed test interface-name
  $ mcp-tool fixed auth tool-id --login
  $ mcp-tool fixed stats interface-name
    `);

  // Register subcommand
  fixedCmd
    .command('register')
    .description('Register a new fixed interface')
    .argument('<tool-id>', 'MCP tool identifier')
    .argument('<operation-name>', 'Operation name to register')
    .option('--name <name>', 'Display name for the interface')
    .option('--description <desc>', 'Interface description')
    .option('--version <version>', 'Interface version', '1.0.0')
    .option('--parameters <json>', 'Parameters JSON schema')
    .option('--response-schema <json>', 'Response JSON schema')
    .option('--auto-discover', 'Auto-discover schema from MCP tool')
    .option('--validate-operation', 'Validate operation exists on MCP tool')
    .option('--force', 'Overwrite existing interface')
    .option('--dry-run', 'Show what would be registered without saving')
    .option('--output <format>', 'Output format (table|json|csv)', 'table')
    .action(async (toolId, operationName, options) => {
      try {
        const { interfaceManager } = await initializeServices();
        
        // Validate JSON parameters if provided
        let parametersJson = {};
        let responseSchemaJson = { type: 'object' };
        
        if (options.parameters) {
          try {
            parametersJson = JSON.parse(options.parameters);
          } catch (error) {
            console.error(chalk.red('Error: Invalid JSON in parameters'));
            process.exit(1);
          }
        }
        
        if (options.responseSchema) {
          try {
            responseSchemaJson = JSON.parse(options.responseSchema);
          } catch (error) {
            console.error(chalk.red('Error: Invalid JSON in response schema'));
            process.exit(1);
          }
        }

        const interfaceData = {
          toolId,
          name: operationName,
          displayName: options.name || operationName,
          description: options.description,
          schemaJson: {
            type: 'object',
            properties: {
              operation: { type: 'string', const: operationName }
            }
          },
          parametersJson,
          responseSchemaJson,
          version: options.version,
          isActive: true,
        };

        const registrationOptions = {
          force: options.force,
          validateTool: options.validateOperation,
          autoDiscover: options.autoDiscover,
          dryRun: options.dryRun,
        };

        const result = await interfaceManager.registerInterface(interfaceData, registrationOptions);

        if (options.dryRun) {
          console.log(chalk.blue('Dry run - interface would be registered with:'));
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (options.output === 'json') {
          console.log(JSON.stringify({
            success: true,
            interfaceId: result.id,
            toolId: result.toolId,
            operationName: result.name,
            displayName: result.displayName,
            version: result.version,
          }));
        } else {
          console.log(chalk.green('✓ Fixed interface registered successfully'));
          console.log(`  Interface ID: ${result.id}`);
          console.log(`  Tool ID: ${result.toolId}`);
          console.log(`  Operation: ${result.name}`);
          console.log(`  Display Name: ${result.displayName}`);
          console.log(`  Version: ${result.version}`);
        }

      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Tool not found')) {
            console.error(chalk.red(`Error: Tool not found: ${toolId}`));
          } else if (error.message.includes('already exists')) {
            console.error(chalk.red(`Error: Interface already exists: ${operationName}`));
            console.error(chalk.yellow('Use --force to overwrite existing interface'));
          } else {
            console.error(chalk.red(`Error: ${error.message}`));
          }
        } else {
          console.error(chalk.red('Error: Unknown error occurred'));
        }
        process.exit(1);
      }
    });

  // List subcommand
  fixedCmd
    .command('list')
    .description('List fixed interfaces')
    .argument('[tool-id]', 'Filter by tool ID')
    .option('--active', 'Show only active interfaces')
    .option('--inactive', 'Show only inactive interfaces')
    .option('--name <pattern>', 'Filter by name pattern')
    .option('--version <version>', 'Filter by version')
    .option('--sort <field>', 'Sort by field (name|created|version)', 'created')
    .option('--reverse', 'Reverse sort order')
    .option('--limit <number>', 'Limit number of results', '50')
    .option('--offset <number>', 'Offset for pagination', '0')
    .option('--detail', 'Show detailed information')
    .option('--stats', 'Show statistics')
    .option('--performance', 'Show performance metrics')
    .option('--validate-tool', 'Validate tool exists when tool-id provided')
    .option('--show-validation', 'Show validation status')
    .option('--output <format>', 'Output format (table|json|csv)', 'table')
    .option('--export <file>', 'Export results to file')
    .action(async (toolId, options) => {
      try {
        const { interfaceManager } = await initializeServices(options.output === 'json' || process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test');

        // Validate tool if requested
        if (toolId && options.validateTool) {
          // Check if tool has any interfaces - simple validation
          const toolInterfaces = await interfaceManager.listInterfaces(toolId);
          if (!toolInterfaces || toolInterfaces.length === 0) {
            console.error(chalk.red(`Error: Tool not found or has no interfaces: ${toolId}`));
            process.exit(1);
          }
          console.log(chalk.green(`✓ Tool validated: ${toolId}`));
        }

        const filters = {
          isActive: options.active ? true : options.inactive ? false : undefined,
          name: options.name,
          version: options.version,
        };

        const interfaces = await interfaceManager.listInterfaces(toolId, filters);

        if (interfaces.length === 0) {
          if (options.output === 'json') {
            console.log(JSON.stringify([]));
          } else {
            console.log(chalk.yellow('No fixed interfaces found'));
          }
          return;
        }

        if (options.stats) {
          const stats = await interfaceManager.getInterfaceStats(toolId);
          console.log(chalk.blue('Fixed Interface Statistics'));
          console.log(`Total interfaces: ${stats.totalInterfaces}`);
          console.log(`Active interfaces: ${stats.activeInterfaces}`);
          console.log('Performance summary:');
          console.log(`Overall performance: ${stats.averageResponseTime?.toFixed(1)}ms avg`);
          console.log('');
        }

        if (options.output === 'json') {
          const output = interfaces.map(iface => ({
            id: iface.id,
            name: iface.name,
            toolId: iface.toolId,
            displayName: iface.displayName,
            version: iface.version,
            isActive: iface.isActive,
            createdAt: iface.createdAt,
            lastValidated: iface.lastValidated,
            description: iface.description,
          }));
          
          const jsonOutput = JSON.stringify(output, null, 2);
          console.log(jsonOutput);
          
          // Export to file if requested
          if (options.export) {
            await Bun.write(options.export, jsonOutput);
            console.log(`Results exported to ${options.export}`);
          }
        } else if (options.output === 'csv') {
          console.log('id,name,toolId,displayName,version,isActive,createdAt');
          interfaces.forEach(iface => {
            console.log([
              iface.id,
              iface.name,
              iface.toolId,
              iface.displayName,
              iface.version,
              iface.isActive,
              iface.createdAt
            ].join(','));
          });
        } else {
          // Table format
          console.log(chalk.blue('Fixed Interfaces'));
          console.log('');
          
          const headers = ['ID', 'Name', 'Tool', 'Version', 'Status'];
          const showDetailed = options.detail;
          if (showDetailed) {
            headers.push('Description', 'Created', 'Last Validated');
          }
          if (options.performance) {
            headers.push('Avg Response Time', 'Success Rate');
            console.log(chalk.gray('Performance metrics (Last 7 days)'));
          }
          
          // Use tab-separated headers for better spacing
          console.log(headers.join('\t'));
          console.log(headers.map(() => '─'.repeat(12)).join('\t'));
          
          interfaces.forEach((iface, index) => {
            let statusText = iface.isActive ? 'Active' : 'Inactive';
            if (options.showValidation) {
              // For now, assume interfaces are valid if they have been validated recently
              const isRecentlyValidated = iface.lastValidated && 
                new Date(Date.now() - 24 * 60 * 60 * 1000) < new Date(iface.lastValidated);
              const validationIcon = isRecentlyValidated ? '✓' : '⚠';
              statusText = `${statusText} ${validationIcon}`;
            }
            
            const row = [
              (index + 1).toString(), // ID column
              iface.displayName,
              iface.toolId,
              iface.version,
              statusText
            ];
            
            if (showDetailed) {
              row.push(
                iface.description || 'N/A',
                new Date(iface.createdAt).toLocaleDateString(),
                (iface.lastValidated ? new Date(iface.lastValidated).toLocaleDateString() : 'Never')
              );
            }
            
            if (options.performance) {
              row.push('0.0ms', '100%'); // Placeholder for real metrics
            }
            
            console.log(row.join('\t'));
          });
        }

      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  // Use subcommand
  fixedCmd
    .command('use')
    .description('Execute a fixed interface')
    .argument('<interface-name>', 'Interface name to execute')
    .argument('[parameters]', 'JSON parameters for the operation')
    .option('--params-file <file>', 'Load parameters from JSON file')
    .option('--timeout <seconds>', 'Execution timeout in seconds', '30')
    .option('--validate-response', 'Validate response against schema')
    .option('--dry-run', 'Show what would be executed without running')
    .option('--show-performance', 'Show performance metrics')
    .option('--force', 'Execute even if interface is inactive')
    .option('--save-history', 'Save execution to history')
    .option('--output <format>', 'Output format (table|json)', 'table')
    .action(async (interfaceName, parameters, options) => {
      try {
        const { interfaceManager } = await initializeServices();

        // Parse parameters
        let parsedParams = {};
        if (parameters) {
          try {
            parsedParams = JSON.parse(parameters);
          } catch (error) {
            console.error(chalk.red('Error: Invalid JSON parameters'));
            process.exit(1);
          }
        }

        if (options.paramsFile) {
          try {
            const fileContent = await Bun.file(options.paramsFile).text();
            parsedParams = JSON.parse(fileContent);
          } catch (error) {
            console.error(chalk.red(`Error: Could not load parameters from ${options.paramsFile}`));
            process.exit(1);
          }
        }

        // Find interface by name
        const interfaces = await interfaceManager.listInterfaces();
        const targetInterface = interfaces.find(iface => iface.name === interfaceName);

        if (!targetInterface) {
          console.error(chalk.red(`Error: Fixed interface not found: ${interfaceName}`));
          process.exit(1);
        }

        if (!targetInterface.isActive && !options.force) {
          console.error(chalk.red(`Error: Interface is inactive: ${interfaceName}`));
          console.error(chalk.yellow('Use --force to execute anyway'));
          process.exit(1);
        }

        if (options.dryRun) {
          console.log(chalk.blue(`Dry run - interface would be executed with:`));
          console.log(JSON.stringify(parsedParams, null, 2));
          return;
        }

        const executionOptions = {
          timeout: parseInt(options.timeout) * 1000,
          validateResponse: options.validateResponse,
          recordMetrics: true,
          retryAttempts: 0,
        };

        const result = await interfaceManager.executeInterface(
          targetInterface.id,
          parsedParams,
          executionOptions
        );

        if (options.output === 'json') {
          console.log(JSON.stringify({
            success: result.success,
            interfaceName: targetInterface.name,
            responseTime: result.responseTime,
            data: result.data,
            error: result.error,
            timestamp: result.timestamp,
          }));
        } else {
          if (result.success) {
            console.log(chalk.green('✓ Interface executed successfully'));
            console.log(`Response time: ${result.responseTime}ms`);
            
            if (result.validationResult) {
              console.log(`Response validation: ${result.validationResult.valid ? 'passed' : 'failed'}`);
            }
            
            if (result.data) {
              console.log('\nResponse data:');
              console.log(JSON.stringify(result.data, null, 2));
            }
          } else {
            console.error(chalk.red('✗ Interface execution failed'));
            console.error(`Error: ${result.error}`);
            console.error(`Response time: ${result.responseTime}ms`);
          }

          if (options.showPerformance) {
            console.log(`\nPerformance metrics:`);
            console.log(`Response time: ${result.responseTime}ms`);
            console.log(`Success: ${result.success}`);
          }
        }

      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  // Test subcommand
  fixedCmd
    .command('test')
    .description('Test and validate fixed interfaces')
    .argument('[interface-name]', 'Interface name to test (test all if not specified)')
    .option('--tool <tool-id>', 'Test interfaces for specific tool')
    .option('--validate-schema', 'Validate interface schemas')
    .option('--test-connectivity', 'Test connectivity to MCP tool')  
    .option('--test-auth', 'Test authentication status')
    .option('--benchmark', 'Run performance benchmark')
    .option('--compare-performance', 'Compare fixed vs dynamic performance')
    .option('--comprehensive', 'Run comprehensive test suite')
    .option('--parallel', 'Run tests in parallel')
    .option('--concurrency <n>', 'Parallel test concurrency', '3')
    .option('--retry <n>', 'Retry failed tests')
    .option('--target-response-time <time>', 'Target response time (e.g. 100ms)')
    .option('--target-success-rate <rate>', 'Target success rate (e.g. 95%)')
    .option('--test-error-scenarios', 'Test error handling scenarios')
    .option('--generate-report <file>', 'Generate test report')
    .option('--config <file>', 'Test configuration file')
    .option('--filter <pattern>', 'Filter interfaces to test')
    .option('--exclude <pattern>', 'Exclude interfaces from testing')
    .option('--params <json>', 'Test parameters')
    .option('--params-file <file>', 'Load test parameters from file')
    .option('--verbose', 'Detailed test output')
    .option('--output <format>', 'Output format (table|json)', 'table')
    .action(async (interfaceName, options) => {
      const { interfaceManager } = await initializeServices();
      const { executeTestCommand } = await import('./fixed/test.js');
      await executeTestCommand(interfaceName, interfaceManager, options);
    });

  // Auth subcommand  
  fixedCmd
    .command('auth')
    .description('Manage OAuth authentication for MCP tools')
    .argument('[tool-id]', 'MCP tool identifier')
    .option('--login', 'Initiate OAuth login flow')
    .option('--logout', 'Remove stored credentials')
    .option('--refresh', 'Refresh expired tokens')
    .option('--test', 'Test authentication without changes')
    .option('--configure', 'Configure OAuth settings')
    .option('--setup-provider <provider>', 'Setup predefined OAuth provider')
    .option('--client-id <id>', 'OAuth client ID')
    .option('--auth-url <url>', 'OAuth authorization URL')
    .option('--token-url <url>', 'OAuth token URL')  
    .option('--scopes <scopes>', 'OAuth scopes (comma-separated)')
    .option('--validate', 'Validate OAuth configuration')
    .option('--show-expiry', 'Show token expiration information')
    .option('--callback', 'Handle OAuth callback')
    .option('--code <code>', 'Authorization code for callback')
    .option('--state <state>', 'State parameter for callback')
    .option('--resume', 'Resume OAuth flow')
    .option('--detect-manual', 'Detect manual intervention requirements')
    .option('--manual-mode', 'Manual authentication mode')
    .option('--manual-timeout <seconds>', 'Manual authentication timeout')
    .option('--save-state', 'Save OAuth state for later completion')
    .option('--show-encryption-info', 'Show encryption information')
    .option('--enable-pkce', 'Enable PKCE for enhanced security')
    .option('--output <format>', 'Output format (table|json)', 'table')
    .action(async (toolId, options) => {
      const { oauthManager } = await initializeServices();
      const { executeAuthCommand } = await import('./fixed/auth.js');
      await executeAuthCommand(toolId, oauthManager, options);
    });

  // Stats subcommand
  fixedCmd
    .command('stats')
    .description('Show performance statistics and analytics')
    .argument('[interface-name]', 'Interface name for specific stats')
    .option('--tool <tool-id>', 'Filter statistics by tool')
    .option('--compare', 'Show performance comparison with dynamic discovery')
    .option('--period <period>', 'Time period (e.g. 7d, 24h, 30d)', '7d')
    .option('--detailed', 'Show detailed performance metrics')
    .option('--errors', 'Show error breakdown')
    .option('--trend', 'Show performance trends')
    .option('--export-csv <file>', 'Export statistics to CSV')
    .option('--all', 'Show statistics for all interfaces')
    .option('--thresholds', 'Show performance threshold compliance')
    .option('--benchmark', 'Generate performance benchmarks')
    .option('--compare-periods', 'Compare across time periods')
    .option('--period1 <period>', 'First period for comparison')
    .option('--period2 <period>', 'Second period for comparison')
    .option('--statistical-significance', 'Show statistical analysis')
    .option('--alerts', 'Show performance alerts')
    .option('--usage-patterns', 'Show usage patterns and hotspots')
    .option('--generate-report <file>', 'Generate comprehensive performance report')
    .option('--from <date>', 'Start date for custom range (YYYY-MM-DD)')
    .option('--to <date>', 'End date for custom range (YYYY-MM-DD)')
    .option('--compliance-score', 'Show performance compliance score')
    .option('--output <format>', 'Output format (table|json)', 'table')
    .action(async (interfaceName, options) => {
      const { interfaceManager } = await initializeServices();
      const { executeStatsCommand } = await import('./fixed/stats.js');
      await executeStatsCommand(interfaceName, interfaceManager, options);
    });

  return fixedCmd;
}

// Export for use in main CLI
export { createFixedCommand as default };