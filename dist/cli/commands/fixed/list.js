import { Command } from 'commander';
import chalk from 'chalk';
import { FixedInterfaceManager } from '../../../services/fixed-interface/interface-manager';
import { formatOutput } from '../../utils/format';
import { getDatabase } from '../../utils/database';
export const fixedListCommand = new Command('list')
    .description('List registered fixed interfaces')
    .argument('[tool-id]', 'Filter by tool ID (optional)')
    .option('-a, --all', 'Include inactive interfaces')
    .option('-v, --verbose', 'Show detailed information')
    .option('--validate', 'Validate interfaces and show status')
    .option('-o, --output <format>', 'Output format (json|table|csv)', 'table')
    .option('--db <path>', 'Database path')
    .action(async (toolId, options) => {
    try {
        const db = await getDatabase(options.db);
        const manager = new FixedInterfaceManager({
            database: db,
            cacheTimeout: 3600,
            validationInterval: 86400,
            performanceTarget: 100,
            enableMetrics: true
        });
        const filters = {
            toolId,
            activeOnly: !options.all
        };
        const interfaces = await manager.listInterfaces(filters);
        if (interfaces.length === 0) {
            if (options.output === 'json') {
                console.log(JSON.stringify({ interfaces: [] }, null, 2));
            }
            else {
                console.log(chalk.yellow('No fixed interfaces found'));
            }
            return;
        }
        // Validate interfaces if requested
        if (options.validate) {
            for (const iface of interfaces) {
                const validation = await manager.validateInterface(iface.id);
                iface.validationStatus = validation.isValid ? 'valid' : 'invalid';
                iface.validationErrors = validation.errors;
            }
        }
        if (options.output === 'json') {
            console.log(JSON.stringify({ interfaces }, null, 2));
        }
        else {
            console.log(chalk.green(`Found ${interfaces.length} fixed interface(s)`));
            console.log();
            const outputData = interfaces.map(iface => {
                const base = {
                    id: iface.id,
                    toolId: iface.toolId,
                    name: iface.name,
                    displayName: iface.displayName,
                    version: iface.version,
                    active: iface.isActive ? 'yes' : 'no'
                };
                if (options.verbose) {
                    Object.assign(base, {
                        description: iface.description || '-',
                        createdAt: iface.createdAt,
                        lastValidated: iface.lastValidated || 'never'
                    });
                }
                if (options.validate) {
                    Object.assign(base, {
                        status: iface.validationStatus,
                        errors: iface.validationErrors?.join('; ') || '-'
                    });
                }
                return base;
            });
            formatOutput(outputData, options.output);
        }
    }
    catch (error) {
        if (options.output === 'json') {
            console.log(JSON.stringify({
                success: false,
                error: error.message
            }, null, 2));
        }
        else {
            console.error(chalk.red(`Error: ${error.message}`));
        }
        process.exit(1);
    }
});
