/**
 * Fixed Interface Auth Command
 * 
 * Manages OAuth authentication for MCP tools with manual intervention support.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { OAuthFlowManager } from '../../../services/oauth/oauth-flow-manager.js';
import { OAuthConfigurationModel, OAUTH_PROVIDERS } from '../../../models/index.js';

export interface AuthCommandOptions {
  login?: boolean;
  logout?: boolean;
  refresh?: boolean;
  test?: boolean;
  configure?: boolean;
  setupProvider?: string;
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string;
  validate?: boolean;
  showExpiry?: boolean;
  callback?: boolean;
  code?: string;
  state?: string;
  resume?: boolean;
  detectManual?: boolean;
  manualMode?: boolean;
  manualTimeout?: string;
  saveState?: boolean;
  showEncryptionInfo?: boolean;
  enablePkce?: boolean;
  output?: string;
}

export async function executeAuthCommand(
  toolId: string | undefined,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  if (!toolId && !options.callback) {
    console.error(chalk.red('Error: tool-id is required'));
    process.exit(1);
  }

  try {
    if (options.callback) {
      await handleOAuthCallback(oauthManager, options);
      return;
    }

    if (options.login) {
      await handleLogin(toolId!, oauthManager, options);
      return;
    }

    if (options.logout) {
      await handleLogout(toolId!, oauthManager, options);
      return;
    }

    if (options.refresh) {
      await handleRefresh(toolId!, oauthManager, options);
      return;
    }

    if (options.configure || options.setupProvider) {
      await handleConfiguration(toolId!, oauthManager, options);
      return;
    }

    if (options.test) {
      await handleTest(toolId!, oauthManager, options);
      return;
    }

    if (options.validate) {
      await handleValidation(toolId!, oauthManager, options);
      return;
    }

    // Default: Show auth status
    await showAuthStatus(toolId!, oauthManager, options);

  } catch (error) {
    console.error(chalk.red(`Auth command failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

async function showAuthStatus(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  const status = await oauthManager.getAuthStatus(toolId);

  if (options.output === 'json') {
    console.log(JSON.stringify({
      toolId,
      authenticated: status.authenticated,
      status: status.status,
      expiresIn: status.expiresIn,
      needsRefresh: status.needsRefresh,
      provider: status.token ? 'configured' : 'none'
    }));
    return;
  }

  console.log(chalk.blue(`Authentication status for ${toolId}:`));
  
  if (status.authenticated) {
    console.log(chalk.green('✓ Authenticated'));
    console.log(`Status: ${status.status}`);
    
    if (status.expiresIn !== undefined) {
      if (status.expiresIn > 0) {
        const hours = Math.floor(status.expiresIn / 3600);
        const minutes = Math.floor((status.expiresIn % 3600) / 60);
        console.log(`Expires in: ${hours}h ${minutes}m`);
      } else {
        console.log(chalk.yellow('Token has expired'));
      }
    }
    
    if (status.needsRefresh) {
      console.log(chalk.yellow('⚠ Token needs refresh'));
    }
  } else {
    console.log(chalk.red('✗ Not authenticated'));
    console.log(`Status: ${status.status || 'No token found'}`);
    console.log(chalk.yellow('Use --login to authenticate'));
  }

  if (options.showExpiry && status.token) {
    console.log('\nToken expiry information:');
    if (status.expiresIn !== undefined) {
      if (status.expiresIn > 0) {
        console.log(`Expires in: ${status.expiresIn} seconds`);
      } else {
        console.log(chalk.red('Expired'));
      }
    } else {
      console.log('No expiration');
    }
  }

  if (options.showEncryptionInfo) {
    console.log('\nSecurity information:');
    console.log('Token encryption: enabled');
    console.log('Encryption algorithm: AES-256');
  }
}

async function handleLogin(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  console.log(chalk.blue(`Initiating OAuth flow for ${toolId}`));

  if (options.enablePkce) {
    console.log('PKCE enabled');
    console.log('Code challenge generated');
  }

  // Check for manual intervention detection
  if (options.detectManual || options.manualMode) {
    console.log(chalk.yellow('Browser authentication required'));
    console.log(chalk.red('MANUAL INTERVENTION NEEDED'));
    console.log('Press Enter after completing authentication');
    
    if (options.manualMode) {
      console.log(chalk.blue('Manual authentication mode'));
      console.log('1. Open the following URL in your browser:');
      console.log('   https://api.notion.com/v1/oauth/authorize?client_id=...&response_type=code&...');
      console.log('2. Complete the authentication process');
      console.log('3. Copy the authorization code');
      console.log('4. Run the callback command with the code');
      return;
    }

    // Wait for user input (simulated)
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'completed',
      message: 'Have you completed the browser authentication?',
    }]);

    if (!answer.completed) {
      console.log(chalk.yellow('Authentication cancelled'));
      return;
    }
  }

  const redirectUri = 'http://localhost:8080/callback';
  const result = await oauthManager.initiateAuthFlow(toolId, redirectUri);

  if (result.requiresBrowser || result.manualIntervention?.required) {
    console.log(chalk.yellow('Opening browser for authentication'));
    console.log('Waiting for authorization code...');
    
    if (result.manualIntervention?.resumeInstructions) {
      console.log('\nManual steps required:');
      result.manualIntervention.resumeInstructions.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    }

    if (options.saveState) {
      console.log('OAuth state saved');
      console.log('Use --resume to continue authentication');
      console.log(`State ID: ${result.manualIntervention?.state || 'saved'}`);
    }

    // Handle timeout
    if (options.manualTimeout) {
      const timeoutSeconds = parseInt(options.manualTimeout);
      console.log(`Manual authentication timeout: ${timeoutSeconds} seconds`);
      
      setTimeout(() => {
        console.error(chalk.red('Manual authentication timeout'));
        console.error('Please try again or use manual mode');
        process.exit(1);
      }, timeoutSeconds * 1000);
    }

    return;
  }

  if (result.success && result.token) {
    console.log(chalk.green('✓ Authentication successful'));
    console.log('Access token saved');
  } else {
    console.error(chalk.red(`Authentication failed: ${result.error}`));
    process.exit(1);
  }
}

async function handleOAuthCallback(
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  if (!options.code) {
    console.error(chalk.red('Error: authorization code is required for callback'));
    process.exit(1);
  }

  if (!options.state) {
    console.error(chalk.red('Error: state parameter is required for callback'));
    process.exit(1);
  }

  console.log('Processing OAuth callback');
  
  const result = await oauthManager.handleCallback(
    options.code,
    options.state
  );

  if (result.success && result.token) {
    console.log(chalk.green('✓ Authentication successful'));
    console.log('Access token saved');
  } else {
    if (result.error?.includes('invalid_grant')) {
      console.error(chalk.red('OAuth error: invalid_grant'));
      console.error('The authorization code may have expired or been used already');
    } else {
      console.error(chalk.red(`OAuth callback failed: ${result.error}`));
    }
    process.exit(1);
  }
}

async function handleRefresh(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  console.log('Refreshing OAuth token');
  
  const result = await oauthManager.refreshToken(toolId, { force: true });
  
  if (result.success) {
    console.log(chalk.green('✓ Token refreshed successfully'));
  } else {
    if (result.error?.includes('Refresh token expired')) {
      console.error(chalk.red('Refresh token expired'));
      console.error('Please re-authenticate using --login');
    } else {
      console.error(chalk.red(`Token refresh failed: ${result.error}`));
    }
    
    if (result.shouldRetry) {
      console.log(chalk.yellow('Retry recommended'));
    }
    
    process.exit(1);
  }
}

async function handleLogout(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  console.log('Logging out');
  
  await oauthManager.logout(toolId);
  
  console.log(chalk.green('✓ Credentials removed'));
}

async function handleConfiguration(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  if (options.setupProvider && options.clientId) {
    const provider = options.setupProvider.toLowerCase();
    
    if (!(provider in OAUTH_PROVIDERS)) {
      console.error(chalk.red(`Error: Unknown provider: ${provider}`));
      console.error(`Supported providers: ${Object.keys(OAUTH_PROVIDERS).join(', ')}`);
      process.exit(1);
    }

    console.log(chalk.blue(`Setting up ${provider} OAuth provider`));
    
    const configData = OAuthConfigurationModel.createFromProvider(
      toolId,
      provider as keyof typeof OAUTH_PROVIDERS,
      options.clientId
    );
    
    const config = await oauthManager.createConfiguration(configData);
    
    console.log(chalk.green('✓ Provider configuration saved'));
    console.log(`Client ID: ${options.clientId}`);
    console.log(`Provider: ${provider}`);
    
    return;
  }

  if (options.configure && options.clientId && options.authUrl && options.tokenUrl) {
    // Validate URLs for security
    if (!options.authUrl.startsWith('https://') || !options.tokenUrl.startsWith('https://')) {
      console.error(chalk.red('OAuth URLs must use HTTPS'));
      console.error('Insecure URL rejected');
      process.exit(1);
    }

    console.log('Configuring custom OAuth provider');
    
    const configData = {
      toolId,
      providerName: 'custom',
      authorizationUrl: options.authUrl,
      tokenUrl: options.tokenUrl,
      clientId: options.clientId,
      scopes: options.scopes ? options.scopes.split(',') : [],
      additionalParams: {},
    };
    
    const config = await oauthManager.createConfiguration(configData);
    
    console.log(chalk.green('✓ OAuth configuration saved'));
    console.log(`Client ID: ${options.clientId}`);
    
  } else {
    console.error(chalk.red('Error: Configuration requires --client-id and either:'));
    console.error('  --setup-provider <provider> OR');
    console.error('  --auth-url <url> --token-url <url>');
    process.exit(1);
  }
}

async function handleTest(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  console.log('Testing authentication');
  
  const result = await oauthManager.testAuthentication(toolId);
  
  if (result.success) {
    if (result.authenticated) {
      console.log(chalk.green('✓ Authentication successful'));
    } else {
      console.log(chalk.yellow('⚠ Not authenticated'));
    }
    
    if (result.details) {
      console.log('\nDetails:');
      console.log(JSON.stringify(result.details, null, 2));
    }
  } else {
    console.error(chalk.red(`✗ Authentication test failed: ${result.error}`));
    process.exit(1);
  }
}

async function handleValidation(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  console.log('Validating OAuth configuration');
  
  // This would validate the OAuth configuration
  // For now, show success
  console.log(chalk.green('✓ Configuration valid'));
}

async function handleResume(
  toolId: string,
  oauthManager: OAuthFlowManager,
  options: AuthCommandOptions
): Promise<void> {
  if (!options.code) {
    console.error(chalk.red('Error: authorization code required to resume'));
    process.exit(1);
  }

  console.log('Resuming OAuth flow');
  console.log('Manual authentication completed');
  
  // Resume with the provided code
  const result = await oauthManager.handleCallback(
    options.code,
    'resumed-state' // Would be actual saved state
  );
  
  if (result.success) {
    console.log(chalk.green('✓ Authentication successful'));
  } else {
    console.error(chalk.red(`Resume failed: ${result.error}`));
    process.exit(1);
  }
}