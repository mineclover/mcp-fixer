import { Command } from 'commander';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CLIServices, GlobalOptions, OutputFormatter, handleError } from '../index.js';

export function setupSystemCommands(
  program: Command,
  getServices: (options: GlobalOptions) => Promise<CLIServices>
) {

  // mcp-tool init
  program
    .command('init')
    .description('initialize MCP tool database and configuration')
    .argument('[path]', 'optional installation directory')
    .option('--config-file <path>', 'create configuration file')
    .option('--database-path <path>', 'database location')
    .option('--force', 'overwrite existing database', false)
    .action(async (path: string | undefined, options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        if (globalOpts.verbose) {
          formatter.info('Initializing MCP tool system...');
        }

        // Initialize configuration first
        const { getConfig } = await import('../../lib/config.js');
        const config = getConfig(options.configFile);

        // Set custom database path if provided
        if (options.databasePath) {
          config.updateDatabase({ path: options.databasePath });
        }

        // Ensure directories exist
        const dbPath = config.getDatabasePath();
        const dbDir = dirname(dbPath);
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
          if (globalOpts.verbose) {
            formatter.info(`Created directory: ${dbDir}`);
          }
        }

        // Check if database already exists
        if (existsSync(dbPath) && !options.force) {
          formatter.error(`Database already exists at ${dbPath}. Use --force to overwrite.`);
          process.exit(1);
        }

        // Initialize services (this will create the database)
        const services = await getServices(globalOpts);

        // Run health check
        const healthy = await services.db.healthCheck();
        if (!healthy) {
          throw new Error('Database health check failed after initialization');
        }

        // Get system info
        const stats = await services.db.getStats();

        const output = {
          status: 'initialized',
          database: {
            path: dbPath,
            schema_version: stats.schemaVersion,
            size_mb: Math.round((stats.pageCount * stats.pageSize) / 1024 / 1024 * 100) / 100,
          },
          config: {
            path: config.getConfigPath(),
            data_directory: config.dataDirectory,
          },
          directories_created: [
            dbDir,
            config.getLogPath(),
            config.getBackupPath(),
          ].filter(dir => {
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
              return true;
            }
            return false;
          }),
        };

        formatter.output(output);
        formatter.success('MCP tool system initialized successfully');

        if (!globalOpts.quiet) {
          formatter.info('You can now use "mcp-tool discover" to find MCP tools');
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool status
  program
    .command('status')
    .description('show system status and health information')
    .option('--database', 'show database status', false)
    .option('--tools', 'show tool connection status', false)
    .option('--credentials', 'show credential status (no secrets)', false)
    .option('--collectors', 'show collector status', false)
    .option('--all', 'show all status information', false)
    .action(async (options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        const output: any = {};

        // Always show basic system info
        const dbStats = await services.db.getStats();
        const config = services.config;

        output.system = {
          version: '1.0.0', // TODO: Get from package.json
          config_path: config.getConfigPath(),
          data_directory: config.dataDirectory,
          database_path: config.getDatabasePath(),
        };

        if (options.database || options.all) {
          output.database = {
            path: config.getDatabasePath(),
            schema_version: dbStats.schemaVersion,
            size_mb: Math.round((dbStats.pageCount * dbStats.pageSize) / 1024 / 1024 * 100) / 100,
            page_count: dbStats.pageCount,
            journal_mode: dbStats.journalMode,
            wal_checkpoint: dbStats.walCheckpoint,
            healthy: await services.db.healthCheck(),
          };
        }

        if (options.tools || options.all) {
          const toolStats = services.db.prepare(`
            SELECT 
              status,
              COUNT(*) as count,
              COUNT(CASE WHEN last_checked > datetime('now', '-1 day') THEN 1 END) as recent_checks
            FROM tools 
            GROUP BY status
          `).all() as any[];

          const toolsByStatus = toolStats.reduce((acc, row) => {
            acc[row.status] = {
              count: row.count,
              recent_checks: row.recent_checks,
            };
            return acc;
          }, {});

          output.tools = {
            total: toolStats.reduce((sum, row) => sum + row.count, 0),
            by_status: toolsByStatus,
          };
        }

        if (options.credentials || options.all) {
          const credStats = await services.authManager.getStats();
          output.credentials = {
            total: credStats.totalCredentials,
            by_type: credStats.credentialsByType,
            expired: credStats.expiredCredentials,
            expiring_soon: credStats.expiringSoonCredentials,
            average_usage: credStats.averageUsageCount,
          };
        }

        if (options.collectors || options.all) {
          const collectorStats = await services.collectorManager.getCollectorStats();
          output.collectors = {
            total: collectorStats.totalCollectors,
            enabled: collectorStats.enabledCollectors,
            disabled: collectorStats.disabledCollectors,
            total_executions: collectorStats.totalExecutions,
            most_used: collectorStats.mostUsedCollectors.map(c => ({
              name: c.name,
              execution_count: c.executionCount,
              last_executed: c.lastExecuted,
            })),
          };
        }

        // Add query stats if all requested
        if (options.all) {
          const queryStats = await services.queryEngine.getQueryStats();
          output.queries = {
            total: queryStats.totalQueries,
            total_executions: queryStats.totalExecutions,
            successful_executions: queryStats.successfulExecutions,
            failed_executions: queryStats.failedExecutions,
            average_execution_time: queryStats.averageExecutionTime,
            top_queries: queryStats.topQueries.map(q => ({
              name: q.name,
              execution_count: q.executionCount,
              last_executed: q.lastExecuted,
            })),
          };
        }

        formatter.output(output);

        // Show health summary
        if (!globalOpts.quiet) {
          const dbHealthy = await services.db.healthCheck();
          if (dbHealthy) {
            formatter.success('System is healthy');
          } else {
            formatter.error('System health check failed');
            process.exit(1);
          }
        }

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool backup
  program
    .command('backup')
    .description('create a backup of the database')
    .argument('[path]', 'backup file path')
    .option('--compress', 'compress backup file', false)
    .action(async (backupPath: string | undefined, options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        // Generate backup path if not provided
        if (!backupPath) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          backupPath = `${services.config.getBackupPath()}/mcp-tool-backup-${timestamp}.db`;
        }

        // Ensure backup directory exists
        const backupDir = dirname(backupPath);
        if (!existsSync(backupDir)) {
          mkdirSync(backupDir, { recursive: true });
        }

        if (globalOpts.verbose) {
          formatter.info(`Creating backup at ${backupPath}...`);
        }

        await services.db.backup(backupPath);

        // Get backup file size
        const { statSync } = await import('fs');
        const backupStat = statSync(backupPath);
        const sizeMB = Math.round(backupStat.size / 1024 / 1024 * 100) / 100;

        const output = {
          backup_path: backupPath,
          size_mb: sizeMB,
          created_at: new Date().toISOString(),
          compressed: options.compress,
        };

        formatter.output(output);
        formatter.success(`Backup created successfully (${sizeMB} MB)`);

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });

  // mcp-tool config
  program
    .command('config')
    .description('manage system configuration')
    .option('--show', 'show current configuration', false)
    .option('--reset', 'reset to default configuration', false)
    .option('--validate', 'validate configuration', false)
    .action(async (options, command) => {
      const globalOpts = command.parent?.opts() as GlobalOptions;
      const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);

      try {
        const services = await getServices(globalOpts);

        if (options.reset) {
          const inquirer = require('inquirer');
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to reset configuration to defaults?',
              default: false,
            },
          ]);

          if (answers.confirm) {
            services.config.reset();
            formatter.success('Configuration reset to defaults');
          } else {
            formatter.info('Operation cancelled');
          }
          return;
        }

        if (options.validate) {
          const validation = services.config.validate();
          if (validation.valid) {
            formatter.success('Configuration is valid');
          } else {
            formatter.error('Configuration validation failed:');
            for (const error of validation.errors) {
              formatter.error(`  ${error}`);
            }
            process.exit(1);
          }
          return;
        }

        // Show configuration (default)
        const config = services.config.export();
        formatter.output(config);

      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
      }
    });
}