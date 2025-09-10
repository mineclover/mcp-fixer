import { Command } from 'commander';
import { CLIServices, GlobalOptions, OutputFormatter, handleError } from '../index.js';
import { ToolModel } from '../../models/tool.js';

export function setupDiscoveryCommands(
  program: Command,
  getServices: (options: GlobalOptions) => Promise<CLIServices>
) {
  
  // mcp-tool discover command
  const discoverCmd = program
    .command('discover')
    .description('discover available MCP tools and analyze their capabilities')
    .argument('[endpoint]', 'MCP server endpoint to discover')
    .option('--scan-local', 'scan local MCP servers', false)
    .option('--scan-network', 'scan network endpoints', false)
    .option('--timeout <seconds>', 'discovery timeout', '30')
    .option('--save', 'save discovered tools to database', false)
    .option('--auto', 'auto-discovery mode', false)
    .option('--no-auto', 'disable auto-discovery')
    .action(async (endpoint: string | undefined, options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);
        const timeout = parseInt(options.timeout) * 1000;

        let discoveryResults: any[] = [];

        if (globalOpts.verbose) {
          formatter.info('Starting tool discovery...');
        }

        if (options.auto || (!endpoint && !options.noAuto)) {
          // Auto-discovery mode
          if (globalOpts.verbose) {
            formatter.info('Running auto-discovery for local MCP tools...');
          }

          const autoResult = await services.discoveryService.autoDiscoverLocal();
          discoveryResults.push(autoResult);

        } else if (endpoint) {
          // Discover specific endpoint
          if (globalOpts.verbose) {
            formatter.info(`Discovering tools at ${endpoint}...`);
          }

          try {
            new URL(endpoint); // Validate URL
          } catch {
            formatter.error('Invalid endpoint URL provided');
            process.exit(1);
          }

          const result = await services.discoveryService.discoverFromEndpoint(endpoint, {
            timeout,
          });
          discoveryResults.push(result);

        } else {
          formatter.error('endpoint required when auto-discovery is disabled');
          process.exit(1);
        }

        // Process results
        const allTools: any[] = [];
        const errors: any[] = [];

        for (const result of discoveryResults) {
          if (result.status === 'success') {
            allTools.push(...result.tools.map((tool: any) => ({
              name: tool.name,
              version: tool.version,
              description: tool.description || '',
              endpoint: tool.endpoint,
              capabilities: tool.capabilities.length,
              auth_required: tool.authConfig.required,
              status: tool.status,
            })));
          } else {
            errors.push({
              endpoint: result.endpoint,
              error: result.error || 'Unknown error',
            });
          }
        }

        // Save tools if requested
        let saveResults = null;
        if (options.save && allTools.length > 0) {
          const toolsToSave = discoveryResults.flatMap(r => r.tools);
          saveResults = await services.discoveryService.saveTools(toolsToSave);
          
          if (globalOpts.verbose) {
            formatter.success(`Saved ${saveResults.saved.length} tools`);
            if (saveResults.skipped > 0) {
              formatter.info(`Skipped ${saveResults.skipped} existing tools`);
            }
            if (saveResults.errors.length > 0) {
              formatter.warn(`${saveResults.errors.length} save errors occurred`);
            }
          }
        }

        // Format output
        const output: any = {
          discovered: allTools,
        };

        if (errors.length > 0) {
          output.errors = errors;
        }

        if (options.save && saveResults) {
          output.saved = saveResults.saved.length;
          output.skipped = saveResults.skipped;
          if (saveResults.errors.length > 0) {
            output.save_errors = saveResults.errors;
          }
        }

        // Output results
        if (globalOpts.format === 'table' && allTools.length > 0) {
          formatter.output(allTools);
        } else {
          formatter.output(output);
        }

        // Show summary message
        if (!globalOpts.quiet) {
          if (allTools.length > 0) {
            formatter.success(`Found ${allTools.length} MCP tool${allTools.length === 1 ? '' : 's'}`);
          } else {
            formatter.info('No MCP tools discovered');
          }
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool tools command
  const toolsCmd = program
    .command('tools')
    .description('list and manage discovered tools')
    .option('--list', 'list all tools (default)', true)
    .option('--status <status>', 'filter by status (active|inactive|deprecated)')
    .option('--refresh', 'refresh tool capabilities', false)
    .option('--remove <tool-id>', 'remove tool from database')
    .action(async (options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        if (options.remove) {
          // Remove tool
          const stmt = services.db.prepare('DELETE FROM tools WHERE id = ?');
          const result = stmt.run(options.remove);
          
          if (result.changes > 0) {
            formatter.success(`Tool removed successfully`);
          } else {
            formatter.error(`Tool with ID '${options.remove}' not found`);
            process.exit(1);
          }
          return;
        }

        if (options.refresh) {
          // Refresh capabilities
          if (globalOpts.verbose) {
            formatter.info('Refreshing tool capabilities...');
          }

          const refreshResult = await services.discoveryService.refreshToolCapabilities();
          
          if (globalOpts.verbose) {
            formatter.success(`Refreshed ${refreshResult.refreshed.length} tools`);
            if (refreshResult.errors.length > 0) {
              formatter.warn(`${refreshResult.errors.length} refresh errors occurred`);
            }
          }

          formatter.output({
            refreshed: refreshResult.refreshed.length,
            errors: refreshResult.errors,
          });
          return;
        }

        // List tools (default action)
        let query = 'SELECT * FROM tools';
        const params: any[] = [];

        if (options.status) {
          query += ' WHERE status = ?';
          params.push(options.status);
        }

        query += ' ORDER BY name, version';

        const rows = services.db.prepare(query).all(...params) as any[];
        const tools = rows.map(row => {
          const tool = ToolModel.fromDatabase(row);
          return {
            id: tool.id,
            name: tool.name,
            version: tool.version,
            status: tool.status,
            last_checked: tool.lastChecked,
            capabilities_count: tool.capabilities.length,
            endpoint: tool.endpoint,
          };
        });

        if (globalOpts.format === 'json') {
          formatter.output({ tools });
        } else {
          formatter.output(tools);
        }

        if (!globalOpts.quiet && tools.length > 0) {
          formatter.info(`Found ${tools.length} tool${tools.length === 1 ? '' : 's'}`);
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });
}