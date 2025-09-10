#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { getConfig } from '../lib/config.js';
import { initializeDatabase } from '../lib/database.js';
import { AuthManager } from '../services/auth/auth-manager.js';
import { ToolDiscoveryService } from '../services/discovery/tool-discovery.js';
import { QueryEngine } from '../services/query/query-engine.js';
import { CollectorManager } from '../services/collector/collector-manager.js';
import { MCPClient } from '../services/discovery/mcp-client.js';
// Import command modules
import { setupDiscoveryCommands } from './commands/discovery.js';
import { setupAuthCommands } from './commands/auth.js';
import { setupQueryCommands } from './commands/query.js';
import { setupCollectorCommands } from './commands/collector.js';
import { setupSystemCommands } from './commands/system.js';
import { createFixedCommand } from './commands/fixed.js';
// Output formatting utilities
export class OutputFormatter {
    format;
    quiet;
    constructor(format, quiet) {
        this.format = format;
        this.quiet = quiet;
    }
    success(message) {
        if (!this.quiet) {
            console.log(chalk.green(message));
        }
    }
    error(message) {
        console.error(chalk.red(`Error: ${message}`));
    }
    warn(message) {
        if (!this.quiet) {
            console.warn(chalk.yellow(`Warning: ${message}`));
        }
    }
    info(message) {
        if (!this.quiet) {
            console.log(chalk.blue(message));
        }
    }
    verbose(message) {
        // Only shown when verbose flag is set
    }
    output(data) {
        switch (this.format) {
            case 'json':
                console.log(JSON.stringify(data, null, 2));
                break;
            case 'table':
                this.outputTable(data);
                break;
            case 'csv':
                this.outputCSV(data);
                break;
        }
    }
    outputTable(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) {
                console.log('No data to display');
                return;
            }
            // Use simple table formatting
            const headers = Object.keys(data[0]);
            console.log(headers.join('\t'));
            console.log(headers.map(() => '---').join('\t'));
            for (const row of data) {
                console.log(headers.map(h => String(row[h] || '')).join('\t'));
            }
        }
        else if (typeof data === 'object' && data !== null) {
            for (const [key, value] of Object.entries(data)) {
                console.log(`${key}:\t${value}`);
            }
        }
        else {
            console.log(String(data));
        }
    }
    outputCSV(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) {
                return;
            }
            const headers = Object.keys(data[0]);
            console.log(headers.join(','));
            for (const row of data) {
                const values = headers.map(h => {
                    const value = row[h];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return String(value || '');
                });
                console.log(values.join(','));
            }
        }
        else {
            console.log(JSON.stringify(data));
        }
    }
}
// Error handling
export function handleError(error, options) {
    const formatter = new OutputFormatter(options.format, options.quiet);
    if (options.verbose) {
        formatter.error(error.stack || error.message);
    }
    else {
        formatter.error(error.message);
    }
    process.exit(1);
}
// Service initialization
async function initializeServices(options) {
    try {
        // Initialize configuration
        const config = getConfig(options.config);
        // Apply CLI overrides
        if (options.database) {
            config.updateDatabase({ path: options.database });
        }
        // Initialize database
        const dbConfig = {
            path: config.getDatabasePath(),
            enableWAL: config.database.enableWAL,
            busyTimeout: config.database.busyTimeout,
            journalMode: config.database.journalMode,
        };
        const db = await initializeDatabase(dbConfig);
        // Initialize services
        const authManager = new AuthManager(db, config);
        await authManager.initialize();
        const discoveryService = new ToolDiscoveryService(db, config);
        const queryEngine = new QueryEngine(db, config);
        const collectorManager = new CollectorManager(db, config);
        const mcpClient = new MCPClient(db, config, authManager);
        return {
            config,
            db,
            authManager,
            discoveryService,
            queryEngine,
            collectorManager,
            mcpClient,
        };
    }
    catch (error) {
        throw new Error(`Failed to initialize services: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// Main CLI setup
async function main() {
    const program = new Command();
    // Read package.json for version
    let version = '1.0.0';
    try {
        const packagePath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        version = packageJson.version;
    }
    catch (error) {
        // Use default version if package.json not found
    }
    program
        .name('mcp-tool')
        .description('MCP Tool Management & Query System')
        .version(version)
        .option('-c, --config <path>', 'path to configuration file')
        .option('-d, --database <path>', 'path to SQLite database file')
        .option('-f, --format <format>', 'output format (json|table|csv)', 'json')
        .option('-v, --verbose', 'enable verbose output', false)
        .option('-q, --quiet', 'suppress non-error output', false);
    // Add global error handler
    program.configureHelp({
        sortSubcommands: true,
    });
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        console.error(chalk.red('Uncaught Exception:'), error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
        process.exit(1);
    });
    // Setup command groups
    try {
        // Initialize services for command setup (light initialization)
        let services = null;
        // Helper to get services (lazy initialization)
        const getServices = async (options) => {
            if (!services) {
                services = await initializeServices(options);
            }
            return services;
        };
        // Setup command modules
        setupDiscoveryCommands(program, getServices);
        setupAuthCommands(program, getServices);
        setupQueryCommands(program, getServices);
        setupCollectorCommands(program, getServices);
        setupSystemCommands(program, getServices);
        // Setup fixed interface command
        const fixedCommand = createFixedCommand(getServices);
        program.addCommand(fixedCommand);
    }
    catch (error) {
        console.error(chalk.red('Failed to setup commands:'), error);
        process.exit(1);
    }
    // Add default help behavior
    program.action(() => {
        program.help();
    });
    // Parse and execute
    try {
        await program.parseAsync(process.argv);
    }
    catch (error) {
        if (error instanceof Error) {
            handleError(error, program.opts());
        }
        else {
            console.error(chalk.red('Unknown error:'), error);
            process.exit(1);
        }
    }
}
// Types are already exported at their definitions above
// Run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error(chalk.red('CLI startup failed:'), error);
        process.exit(1);
    });
}
