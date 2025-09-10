import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { CLIServices, GlobalOptions, OutputFormatter, handleError } from '../index.js';

export function setupCollectorCommands(
  program: Command,
  getServices: (options: GlobalOptions) => Promise<CLIServices>
) {

  const collectorCmd = program.command('collector').description('manage custom data collectors');

  // mcp-tool collector register
  collectorCmd
    .command('register')
    .description('register a custom data collector')
    .argument('<path>', 'path to collector module')
    .option('--name <name>', 'collector name')
    .option('--description <text>', 'collector description')
    .option('--timeout <seconds>', 'execution timeout', '30')
    .option('--test', 'test collector after registration', false)
    .action(async (path: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        let name = options.name;
        if (!name) {
          // Generate name from file path
          const filename = path.split('/').pop() || path;
          name = filename.replace(/\.[^/.]+$/, ''); // Remove extension
        }

        const timeout = parseInt(options.timeout);

        if (globalOpts.verbose) {
          formatter.info(`Registering collector '${name}' from ${path}...`);
        }

        const collector = await services.collectorManager.registerCollector(
          path,
          name,
          options.description,
          timeout
        );

        const output = {
          id: collector.id,
          name: collector.name,
          file_path: collector.filePath,
          description: collector.description,
          timeout: collector.timeout,
          version: collector.version,
          input_schema: collector.inputSchema,
          output_schema: collector.outputSchema,
          status: 'registered',
        };

        formatter.output(output);
        formatter.success(`Collector '${name}' registered successfully`);

        // Test collector if requested
        if (options.test) {
          if (globalOpts.verbose) {
            formatter.info('Testing registered collector...');
          }

          const testResult = await services.collectorManager.testCollector(collector.id);
          
          if (testResult.status === 'success') {
            formatter.success('Collector test passed');
          } else {
            formatter.warn(`Collector test failed: ${testResult.error}`);
          }
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool collector list
  collectorCmd
    .command('list')
    .description('list registered data collectors')
    .option('--enabled', 'show only enabled collectors', false)
    .option('--test-all', 'test all collectors', false)
    .action(async (options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        const collectors = await services.collectorManager.listCollectors(options.enabled);

        const collectorInfo = collectors.map(collector => ({
          id: collector.id,
          name: collector.name,
          description: collector.description,
          enabled: collector.enabled,
          version: collector.version,
          execution_count: collector.executionCount,
          last_executed: collector.lastExecuted,
          file_path: collector.filePath,
        }));

        if (options.testAll) {
          if (globalOpts.verbose) {
            formatter.info('Testing all collectors...');
          }

          for (const collector of collectors) {
            if (collector.enabled) {
              try {
                const testResult = await services.collectorManager.testCollector(collector.id);
                const collectorItem = collectorInfo.find(c => c.id === collector.id);
                if (collectorItem) {
                  (collectorItem as any).test_status = testResult.status;
                  (collectorItem as any).test_error = testResult.error;
                }
              } catch (error) {
                const collectorItem = collectorInfo.find(c => c.id === collector.id);
                if (collectorItem) {
                  (collectorItem as any).test_status = 'error';
                  (collectorItem as any).test_error = error instanceof Error ? error.message : String(error);
                }
              }
            }
          }
        }

        if (globalOpts.format === 'json') {
          formatter.output({ collectors: collectorInfo });
        } else {
          formatter.output(collectorInfo);
        }

        if (!globalOpts.quiet) {
          formatter.info(`Found ${collectors.length} collector${collectors.length === 1 ? '' : 's'}`);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool collector run
  collectorCmd
    .command('run')
    .description('execute a data collector')
    .argument('<name>', 'collector name')
    .option('--input <json>', 'input parameters JSON')
    .option('--input-file <file>', 'read input from file')
    .option('--output <file>', 'save output to file')
    .option('--timeout <seconds>', 'execution timeout')
    .action(async (name: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        // Parse input parameters
        let input: Record<string, any> = {};

        if (options.inputFile) {
          try {
            const fileContent = require('fs').readFileSync(options.inputFile, 'utf8');
            input = JSON.parse(fileContent);
          } catch (error) {
            formatter.error(`Failed to read input file: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        } else if (options.input) {
          try {
            input = JSON.parse(options.input);
          } catch {
            formatter.error('Invalid input JSON');
            process.exit(1);
          }
        }

        // Set execution options
        const executionOptions: any = {};
        if (options.timeout) {
          executionOptions.timeout = parseInt(options.timeout) * 1000;
        }

        if (globalOpts.verbose) {
          formatter.info(`Executing collector '${name}'...`);
        }

        const result = await services.collectorManager.executeCollector(
          name,
          input,
          executionOptions
        );

        // Save output to file if requested
        if (options.output && result.output) {
          try {
            writeFileSync(options.output, JSON.stringify(result.output, null, 2));
            if (globalOpts.verbose) {
              formatter.success(`Output saved to ${options.output}`);
            }
          } catch (error) {
            formatter.warn(`Failed to save output: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Format output
        const output = {
          collector_id: result.collectorId,
          status: result.status,
          execution_time: Math.round(result.executionTime),
          output: result.output,
          error: result.error,
          stdout: globalOpts.verbose ? result.stdout : undefined,
          stderr: globalOpts.verbose ? result.stderr : undefined,
          exit_code: result.exitCode,
        };

        formatter.output(output);

        if (result.status === 'success') {
          formatter.success(`Collector executed successfully in ${Math.round(result.executionTime)}ms`);
        } else {
          formatter.error(`Collector execution ${result.status}: ${result.error}`);
          process.exit(1);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool collector enable/disable
  collectorCmd
    .command('enable')
    .description('enable a collector')
    .argument('<name>', 'collector name')
    .action(async (name: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);
        
        const success = await services.collectorManager.setCollectorEnabled(name, true);
        if (success) {
          formatter.success(`Collector '${name}' enabled`);
        } else {
          formatter.error(`Collector '${name}' not found`);
          process.exit(1);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  collectorCmd
    .command('disable')
    .description('disable a collector')
    .argument('<name>', 'collector name')
    .action(async (name: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);
        
        const success = await services.collectorManager.setCollectorEnabled(name, false);
        if (success) {
          formatter.success(`Collector '${name}' disabled`);
        } else {
          formatter.error(`Collector '${name}' not found`);
          process.exit(1);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool collector remove
  collectorCmd
    .command('remove')
    .description('remove a collector')
    .argument('<name>', 'collector name')
    .option('--force', 'force removal without confirmation', false)
    .action(async (name: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        if (!options.force) {
          const inquirer = require('inquirer');
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to remove collector '${name}'?`,
              default: false,
            },
          ]);

          if (!answers.confirm) {
            formatter.info('Operation cancelled');
            return;
          }
        }

        const success = await services.collectorManager.removeCollector(name);
        if (success) {
          formatter.success(`Collector '${name}' removed`);
        } else {
          formatter.error(`Collector '${name}' not found`);
          process.exit(1);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });
}