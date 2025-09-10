import inquirer from 'inquirer';
import { OutputFormatter, handleError } from '../index.js';
export function setupAuthCommands(program, getServices) {
    const authCmd = program
        .command('auth')
        .description('manage authentication credentials for MCP tools')
        .argument('<tool-id>', 'tool identifier')
        .option('--set-api-key <key>', 'set API key authentication')
        .option('--set-bearer <token>', 'set Bearer token authentication')
        .option('--set-basic <user:pass>', 'set basic authentication')
        .option('--set-oauth <token>', 'set OAuth token authentication')
        .option('--header <name>', 'custom header name for API key (default: X-API-Key)')
        .option('--remove', 'remove stored credentials', false)
        .option('--test', 'test authentication with tool', false)
        .option('--expires <date>', 'set credential expiration (ISO date)')
        .option('--list', 'list credential information (no secrets)', false)
        .action(async (toolId, options, command) => {
        const globalOpts = command.parent?.opts();
        const formatter = new OutputFormatter(globalOpts.format, globalOpts.quiet);
        try {
            const services = await getServices(globalOpts);
            // Verify tool exists
            const tool = services.db.prepare('SELECT * FROM tools WHERE id = ? OR name = ?').get(toolId, toolId);
            if (!tool) {
                formatter.error(`Tool '${toolId}' not found`);
                process.exit(3);
            }
            const actualToolId = tool.id;
            if (options.remove) {
                // Remove credentials
                const success = await services.authManager.removeCredentials(actualToolId);
                if (success) {
                    formatter.success('Credentials removed successfully');
                }
                else {
                    formatter.info('No credentials found to remove');
                }
                return;
            }
            if (options.list) {
                // List credential information
                const credentials = await services.authManager.listCredentials(actualToolId);
                if (credentials.length === 0) {
                    formatter.info('No credentials stored for this tool');
                    return;
                }
                const credInfo = credentials.map(cred => ({
                    id: cred.id,
                    auth_type: cred.authType,
                    created_at: cred.createdAt,
                    expires_at: cred.expiresAt,
                    last_used: cred.lastUsed,
                    usage_count: cred.usageCount,
                    is_expired: cred.isExpired,
                    is_expiring_soon: cred.isExpiringSoon,
                }));
                formatter.output(globalOpts.format === 'json' ? { credentials: credInfo } : credInfo);
                return;
            }
            if (options.test) {
                // Test authentication
                if (globalOpts.verbose) {
                    formatter.info(`Testing authentication for ${tool.name}...`);
                }
                const testResult = await services.authManager.testCredentials(actualToolId, tool.endpoint);
                const output = {
                    tool_id: actualToolId,
                    tool_name: tool.name,
                    test_result: testResult.success ? 'success' : 'failed',
                    status_code: testResult.statusCode,
                    response_time: testResult.responseTime,
                    error: testResult.error,
                };
                formatter.output(output);
                if (testResult.success) {
                    formatter.success('Authentication test passed');
                }
                else {
                    formatter.error(`Authentication test failed: ${testResult.error}`);
                    process.exit(1);
                }
                return;
            }
            // Set credentials
            let authType;
            let credentialData;
            if (options.setApiKey) {
                authType = 'api_key';
                credentialData = {
                    apiKey: options.setApiKey,
                    header: options.header || 'X-API-Key',
                };
            }
            else if (options.setBearerToken || options.setBearertToken) {
                authType = 'bearer';
                credentialData = {
                    token: options.setBearerToken || options.setBearertToken,
                };
            }
            else if (options.setBasic) {
                authType = 'basic';
                const [username, password] = options.setBasic.split(':');
                if (!username || !password) {
                    formatter.error('Basic auth format should be "username:password"');
                    process.exit(2);
                }
                credentialData = {
                    username,
                    password,
                };
            }
            else if (options.setOauth) {
                authType = 'oauth';
                credentialData = {
                    accessToken: options.setOauth,
                    tokenType: 'Bearer',
                };
            }
            else {
                // Interactive mode - prompt for credentials
                authType = await promptForAuthType();
                credentialData = await promptForCredentials(authType);
            }
            // Parse expiration date if provided
            let expiresAt;
            if (options.expires) {
                try {
                    expiresAt = new Date(options.expires);
                    if (isNaN(expiresAt.getTime())) {
                        throw new Error('Invalid date');
                    }
                    if (expiresAt <= new Date()) {
                        formatter.warn('Expiration date is in the past');
                    }
                }
                catch {
                    formatter.error('Invalid expiration date format. Use ISO date format (YYYY-MM-DDTHH:MM:SSZ)');
                    process.exit(2);
                }
            }
            // Store credentials
            if (globalOpts.verbose) {
                formatter.info(`Storing ${authType} credentials...`);
            }
            const credential = await services.authManager.storeCredentials(actualToolId, authType, credentialData, expiresAt);
            const output = {
                tool_id: actualToolId,
                tool_name: tool.name,
                auth_type: authType,
                status: 'stored',
                expires_at: credential.expiresAt,
                credential_id: credential.id,
            };
            formatter.output(output);
            formatter.success(`${authType} credentials stored successfully`);
            // Optionally test the credentials
            if (globalOpts.verbose) {
                formatter.info('Testing stored credentials...');
                const testResult = await services.authManager.testCredentials(actualToolId, tool.endpoint);
                if (testResult.success) {
                    formatter.success('Credential test passed');
                }
                else {
                    formatter.warn(`Credential test failed: ${testResult.error}`);
                }
            }
        }
        catch (error) {
            handleError(error instanceof Error ? error : new Error(String(error)), globalOpts);
        }
    });
    // Helper functions for interactive prompts
    async function promptForAuthType() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'authType',
                message: 'Select authentication type:',
                choices: [
                    { name: 'API Key', value: 'api_key' },
                    { name: 'Bearer Token', value: 'bearer' },
                    { name: 'Basic Authentication', value: 'basic' },
                    { name: 'OAuth Token', value: 'oauth' },
                ],
            },
        ]);
        return answers.authType;
    }
    async function promptForCredentials(authType) {
        switch (authType) {
            case 'api_key': {
                const answers = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'apiKey',
                        message: 'Enter API key:',
                        mask: '*',
                        validate: (input) => input.length > 0 || 'API key is required',
                    },
                    {
                        type: 'input',
                        name: 'header',
                        message: 'Enter header name (default: X-API-Key):',
                        default: 'X-API-Key',
                    },
                ]);
                return {
                    apiKey: answers.apiKey,
                    header: answers.header,
                };
            }
            case 'bearer': {
                const answers = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'token',
                        message: 'Enter bearer token:',
                        mask: '*',
                        validate: (input) => input.length > 0 || 'Bearer token is required',
                    },
                ]);
                return {
                    token: answers.token,
                };
            }
            case 'basic': {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'username',
                        message: 'Enter username:',
                        validate: (input) => input.length > 0 || 'Username is required',
                    },
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Enter password:',
                        mask: '*',
                        validate: (input) => input.length > 0 || 'Password is required',
                    },
                ]);
                return {
                    username: answers.username,
                    password: answers.password,
                };
            }
            case 'oauth': {
                const answers = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'accessToken',
                        message: 'Enter OAuth access token:',
                        mask: '*',
                        validate: (input) => input.length > 0 || 'Access token is required',
                    },
                    {
                        type: 'input',
                        name: 'refreshToken',
                        message: 'Enter refresh token (optional):',
                    },
                    {
                        type: 'input',
                        name: 'tokenType',
                        message: 'Enter token type (default: Bearer):',
                        default: 'Bearer',
                    },
                ]);
                const data = {
                    accessToken: answers.accessToken,
                    tokenType: answers.tokenType,
                };
                if (answers.refreshToken) {
                    data.refreshToken = answers.refreshToken;
                }
                return data;
            }
            default:
                throw new Error(`Unsupported authentication type: ${authType}`);
        }
    }
}
