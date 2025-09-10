import { Command } from 'commander';
import inquirer from 'inquirer';
import { readFileSync, writeFileSync } from 'fs';
import { CLIServices, GlobalOptions, OutputFormatter, handleError } from '../index.js';

export function setupQueryCommands(
  program: Command,
  getServices: (options: GlobalOptions) => Promise<CLIServices>
) {

  const queryCmd = program.command('query').description('manage reusable MCP queries');

  // mcp-tool query create
  queryCmd
    .command('create')
    .description('create a new reusable query')
    .argument('<name>', 'query name')
    .option('--tool <tool-id>', 'target tool identifier')
    .option('--operation <operation>', 'MCP operation JSON')
    .option('--parameters <schema>', 'parameter schema JSON')
    .option('--description <text>', 'query description')
    .option('--interactive', 'interactive parameter setup', false)
    .action(async (name: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        // Get tool information
        let toolId = options.tool;
        if (!toolId) {
          // Prompt for tool selection
          const tools = services.db.prepare('SELECT id, name FROM tools WHERE status = ? ORDER BY name').all('active') as any[];
          if (tools.length === 0) {
            formatter.error('No active tools found. Discover tools first using "mcp-tool discover"');
            process.exit(1);
          }

          const toolAnswers = await inquirer.prompt([
            {
              type: 'list',
              name: 'toolId',
              message: 'Select a tool:',
              choices: tools.map(t => ({ name: `${t.name} (${t.id})`, value: t.id })),
            },
          ]);
          toolId = toolAnswers.toolId;
        }

        // Verify tool exists
        const tool = services.db.prepare('SELECT * FROM tools WHERE id = ? OR name = ?').get(toolId, toolId) as any;
        if (!tool) {
          formatter.error(`Tool '${toolId}' not found`);
          process.exit(1);
        }

        let operation = options.operation;
        let parameters = options.parameters;
        let description = options.description;

        if (options.interactive) {
          // Interactive mode
          const queryAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Enter query description:',
              default: description,
            },
            {
              type: 'list',
              name: 'method',
              message: 'Select MCP method:',
              choices: [
                'list_resources',
                'read_resource',
                'call_tool',
                'list_tools',
                'get_prompt',
                'list_prompts',
              ],
            },
          ]);

          description = queryAnswers.description;
          operation = JSON.stringify({ method: queryAnswers.method });

          // Get parameters based on method
          if (queryAnswers.method === 'read_resource') {
            parameters = JSON.stringify({
              type: 'object',
              required: ['uri'],
              properties: {
                uri: { type: 'string', description: 'Resource URI' }
              }
            });
          } else if (queryAnswers.method === 'call_tool') {
            const toolParams = await inquirer.prompt([
              {
                type: 'input',
                name: 'toolName',
                message: 'Enter tool name:',
                validate: (input) => input.length > 0 || 'Tool name is required',
              },
            ]);

            operation = JSON.stringify({ 
              method: queryAnswers.method,
              tool_name: toolParams.toolName
            });

            parameters = JSON.stringify({
              type: 'object',
              properties: {
                arguments: { 
                  type: 'object',
                  description: 'Tool arguments',
                  additionalProperties: true
                }
              }
            });
          } else {
            parameters = JSON.stringify({
              type: 'object',
              properties: {},
              additionalProperties: true
            });
          }
        }

        // Parse and validate JSON inputs
        let operationObj: any;
        let parametersObj: any;

        try {
          operationObj = operation ? JSON.parse(operation) : { method: 'list_resources' };
        } catch {
          formatter.error('Invalid operation JSON');
          process.exit(2);
        }

        try {
          parametersObj = parameters ? JSON.parse(parameters) : {
            type: 'object',
            properties: {},
            additionalProperties: true
          };
        } catch {
          formatter.error('Invalid parameters schema JSON');
          process.exit(2);
        }

        // Create query
        const query = await services.queryEngine.createQuery({
          name,
          description,
          toolId: tool.id,
          parameters: parametersObj,
          operation: operationObj,
          outputSchema: {
            type: 'object',
            additionalProperties: true
          },
        });

        const output = {
          id: query.id,
          name: query.name,
          tool_id: query.toolId,
          tool_name: tool.name,
          description: query.description,
          parameters: parametersObj,
          operation: operationObj,
          status: 'created',
        };

        formatter.output(output);
        formatter.success(`Query '${name}' created successfully`);

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool query list
  queryCmd
    .command('list')
    .description('list saved queries')
    .option('--tool <tool-id>', 'filter by tool')
    .option('--search <term>', 'search by name or description')
    .option('--recent <count>', 'show most recently used queries')
    .action(async (options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        const filters: any = {};
        if (options.tool) {
          // Resolve tool ID
          const tool = services.db.prepare('SELECT id FROM tools WHERE id = ? OR name = ?').get(options.tool, options.tool) as any;
          if (!tool) {
            formatter.error(`Tool '${options.tool}' not found`);
            process.exit(1);
          }
          filters.toolId = tool.id;
        }

        if (options.search) {
          filters.search = options.search;
        }

        const limit = options.recent ? parseInt(options.recent) : 100;
        const result = await services.queryEngine.listQueries(filters, limit);

        // Enhance with tool names
        const enhancedQueries = await Promise.all(
          result.queries.map(async (query) => {
            const tool = services.db.prepare('SELECT name FROM tools WHERE id = ?').get(query.toolId) as any;
            return {
              id: query.id,
              name: query.name,
              tool_name: tool?.name || 'Unknown',
              description: query.description,
              execution_count: query.executionCount,
              last_executed: query.lastExecuted,
              created_at: query.createdAt,
            };
          })
        );

        if (globalOpts.format === 'json') {
          formatter.output({
            queries: enhancedQueries,
            total: result.total,
            has_more: result.hasMore,
          });
        } else {
          formatter.output(enhancedQueries);
        }

        if (!globalOpts.quiet) {
          formatter.info(`Found ${result.queries.length} quer${result.queries.length === 1 ? 'y' : 'ies'}`);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool query run
  queryCmd
    .command('run')
    .description('execute a saved query with parameters')
    .argument('<query-name>', 'name of query to execute')
    .option('--params <json>', 'query parameters as JSON')
    .option('--param <key=value>', 'individual parameter', [])
    .option('--collector <name>', 'use data collector for parameters')
    .option('--output <file>', 'save output to file')
    .option('--timeout <seconds>', 'execution timeout')
    .action(async (queryName: string, options, command) => {
      const globalOpts = command.parent?.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        // Get query
        const query = await services.queryEngine.getQuery(queryName);
        if (!query) {
          formatter.error(`Query '${queryName}' not found`);
          process.exit(2);
        }

        // Parse parameters
        let parameters: Record<string, any> = {};

        if (options.params) {
          try {
            parameters = JSON.parse(options.params);
          } catch {
            formatter.error('Invalid parameters JSON');
            process.exit(3);
          }
        }

        // Parse individual parameters
        if (options.param && Array.isArray(options.param)) {
          for (const param of options.param) {
            const [key, value] = param.split('=');
            if (key && value !== undefined) {
              // Try to parse as JSON, fallback to string
              try {
                parameters[key] = JSON.parse(value);
              } catch {
                parameters[key] = value;
              }
            }
          }
        }

        // Get collector inputs if specified
        let collectorInputs: Record<string, any> = {};
        if (options.collector) {
          if (globalOpts.verbose) {
            formatter.info(`Running data collector '${options.collector}'...`);
          }

          const collectorResult = await services.collectorManager.executeCollector(
            options.collector,
            parameters
          );

          if (collectorResult.status === 'success') {
            collectorInputs[options.collector] = collectorResult.output;
            if (globalOpts.verbose) {
              formatter.success('Data collector executed successfully');
            }
          } else {
            formatter.warn(`Data collector failed: ${collectorResult.error}`);
          }
        }

        // Execute query
        if (globalOpts.verbose) {
          formatter.info(`Executing query '${query.name}'...`);
        }

        const executionOptions: any = {};
        if (options.timeout) {
          executionOptions.timeout = parseInt(options.timeout) * 1000;
        }

        const result = await services.queryEngine.executeQuery(
          query.id,
          parameters,
          collectorInputs,
          executionOptions
        );

        // Save output to file if requested
        if (options.output && result.result) {
          try {
            writeFileSync(options.output, JSON.stringify(result.result, null, 2));
            if (globalOpts.verbose) {
              formatter.success(`Output saved to ${options.output}`);
            }
          } catch (error) {
            formatter.warn(`Failed to save output: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Format output
        const output = {
          query_id: result.queryId,
          execution_id: result.executionId,
          status: result.status,
          result: result.result,
          execution_time: result.executionTime ? Math.round(result.executionTime) : undefined,
          error: result.error,
          started_at: result.startedAt,
          completed_at: result.completedAt,
        };

        formatter.output(output);

        if (result.status === 'completed') {
          formatter.success(`Query executed successfully in ${Math.round(result.executionTime || 0)}ms`);
        } else {
          formatter.error(`Query execution ${result.status}: ${result.error}`);
          process.exit(1);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });
}