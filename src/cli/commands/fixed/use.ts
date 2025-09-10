import { Command } from 'commander';
import chalk from 'chalk';
import { Database } from 'bun:sqlite';
import { FixedInterfaceManager } from '../../../services/fixed-interface/interface-manager';
import { formatOutput } from '../../utils/format';
import { getDatabase } from '../../utils/database';

export const fixedUseCommand = new Command('use')
  .description('Execute a fixed interface operation')
  .argument('<interface-name>', 'Interface name or ID')
  .argument('[parameters...]', 'Operation parameters as key=value pairs')
  .option('-t, --tool-id <id>', 'Tool ID (if using interface name)')
  .option('-p, --params <json>', 'Parameters as JSON object')
  .option('--timeout <ms>', 'Operation timeout in milliseconds', '30000')
  .option('--retry <count>', 'Number of retry attempts', '0')
  .option('--no-cache', 'Disable result caching')
  .option('--validate-response', 'Validate response against schema')
  .option('--record-metrics', 'Record performance metrics', true)
  .option('-o, --output <format>', 'Output format (json|table|csv)', 'json')
  .option('--db <path>', 'Database path')
  .action(async (interfaceName: string, parameters: string[], options: any) => {
    try {
      const db = await getDatabase(options.db);
      const manager = new FixedInterfaceManager({
        database: db,
        cacheTimeout: 3600,
        validationInterval: 86400,
        performanceTarget: 100,
        enableMetrics: true
      });

      // Parse parameters
      let params: Record<string, any> = {};

      if (options.params) {
        try {
          params = JSON.parse(options.params);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON in params'));
          process.exit(1);
        }
      } else if (parameters.length > 0) {
        // Parse key=value parameters
        for (const param of parameters) {
          const [key, ...valueParts] = param.split('=');
          const value = valueParts.join('=');
          
          if (!key || value === undefined) {
            console.error(chalk.red(`Error: Invalid parameter format: ${param}`));
            console.error(chalk.yellow('Use format: key=value'));
            process.exit(1);
          }

          // Try to parse value as JSON if possible
          try {
            params[key] = JSON.parse(value);
          } catch {
            params[key] = value;
          }
        }
      }

      // Find the interface
      let fixedInterface;
      
      // Check if interfaceName is a UUID (interface ID)
      if (interfaceName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        fixedInterface = await manager.getInterface(interfaceName);
      } else {
        // It's a name, need tool ID
        if (!options.toolId) {
          console.error(chalk.red('Error: --tool-id is required when using interface name'));
          process.exit(1);
        }
        fixedInterface = await manager.findInterfaceByName(options.toolId, interfaceName);
      }

      if (!fixedInterface) {
        console.error(chalk.red(`Error: Fixed interface '${interfaceName}' not found`));
        process.exit(1);
      }

      const startTime = Date.now();

      const executionOptions = {
        timeout: parseInt(options.timeout),
        validateResponse: options.validateResponse,
        recordMetrics: options.recordMetrics,
        retryAttempts: parseInt(options.retry),
        useCache: options.cache !== false
      };

      const result = await manager.executeInterface(
        fixedInterface.id,
        params,
        executionOptions
      );

      const responseTime = Date.now() - startTime;

      if (options.output === 'json') {
        console.log(JSON.stringify({
          success: result.success,
          data: result.data,
          error: result.error,
          performance: {
            responseTimeMs: responseTime,
            fromCache: result.fromCache || false
          },
          interface: {
            id: fixedInterface.id,
            name: fixedInterface.name,
            version: fixedInterface.version
          }
        }, null, 2));
      } else {
        if (result.success) {
          console.log(chalk.green('Operation executed successfully'));
          console.log(chalk.gray(`Response time: ${responseTime}ms${result.fromCache ? ' (cached)' : ''}`));
          console.log();
          
          formatOutput(result.data, options.output);
        } else {
          console.error(chalk.red(`Operation failed: ${result.error}`));
          process.exit(1);
        }
      }
    } catch (error: any) {
      if (options.output === 'json') {
        console.log(JSON.stringify({
          success: false,
          error: error.message
        }, null, 2));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });