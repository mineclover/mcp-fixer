import { Command } from 'commander';
import chalk from 'chalk';
import { Database } from 'bun:sqlite';
import { FixedInterfaceManager } from '../../../services/fixed-interface/interface-manager';
import { FixedInterfaceCreate } from '../../../models/fixed-interface';
import { formatOutput } from '../../utils/format';
import { getDatabase } from '../../utils/database';

export const fixedRegisterCommand = new Command('register')
  .description('Register a fixed interface for an MCP tool operation')
  .argument('<tool-id>', 'Tool identifier')
  .argument('<operation-name>', 'Operation name to register')
  .option('-n, --name <name>', 'Display name for the interface')
  .option('-d, --description <desc>', 'Interface description')
  .option('-v, --version <version>', 'Interface version (x.y.z)', '1.0.0')
  .option('-p, --parameters <json>', 'Operation parameters JSON schema')
  .option('-r, --response-schema <json>', 'Response JSON schema')
  .option('-s, --schema <json>', 'Full operation schema JSON')
  .option('--auto-discover', 'Auto-discover schema from MCP tool')
  .option('--validate-operation', 'Validate operation exists on MCP tool')
  .option('--force', 'Overwrite existing interface')
  .option('--dry-run', 'Preview without saving')
  .option('-o, --output <format>', 'Output format (json|table|csv)', 'table')
  .option('--db <path>', 'Database path')
  .action(async (toolId: string, operationName: string, options: any) => {
    try {
      const db = await getDatabase(options.db);
      const manager = new FixedInterfaceManager({
        database: db,
        cacheTimeout: 3600,
        validationInterval: 86400,
        performanceTarget: 100,
        enableMetrics: true
      });

      // Parse JSON inputs
      let schemaJson = {};
      let parametersJson = {};
      let responseSchemaJson = {};

      if (options.schema) {
        try {
          schemaJson = JSON.parse(options.schema);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON in schema'));
          process.exit(1);
        }
      }

      if (options.parameters) {
        try {
          parametersJson = JSON.parse(options.parameters);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON in parameters'));
          process.exit(1);
        }
      }

      if (options.responseSchema) {
        try {
          responseSchemaJson = JSON.parse(options.responseSchema);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON in response schema'));
          process.exit(1);
        }
      }

      // Validate version format
      if (!options.version.match(/^\d+\.\d+\.\d+$/)) {
        console.error(chalk.red('Error: Version must be in format x.y.z'));
        process.exit(1);
      }

      const interfaceData: FixedInterfaceCreate = {
        toolId,
        name: operationName,
        displayName: options.name || operationName,
        description: options.description,
        schemaJson: schemaJson || {},
        parametersJson: parametersJson || {},
        responseSchemaJson: responseSchemaJson || {},
        version: options.version,
        isActive: true
      };

      if (options.dryRun) {
        console.log(chalk.yellow('Dry run - interface would be registered:'));
        formatOutput({
          toolId,
          operationName,
          displayName: interfaceData.displayName,
          version: interfaceData.version,
          description: interfaceData.description
        }, options.output);
        return;
      }

      const registrationOptions = {
        force: options.force,
        validateTool: options.validateOperation,
        autoDiscover: options.autoDiscover,
        dryRun: false
      };

      const fixedInterface = await manager.registerInterface(interfaceData, registrationOptions);

      if (options.output === 'json') {
        console.log(JSON.stringify({
          success: true,
          interfaceId: fixedInterface.id,
          toolId: fixedInterface.toolId,
          operationName: fixedInterface.name,
          version: fixedInterface.version
        }, null, 2));
      } else {
        const message = options.force && fixedInterface.id ? 
          'Fixed interface updated successfully' : 
          'Fixed interface registered successfully';
        
        console.log(chalk.green(message));
        formatOutput({
          id: fixedInterface.id,
          toolId: fixedInterface.toolId,
          name: fixedInterface.name,
          displayName: fixedInterface.displayName,
          version: fixedInterface.version,
          isActive: fixedInterface.isActive
        }, options.output);
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