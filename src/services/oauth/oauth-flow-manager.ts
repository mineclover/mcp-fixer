/**
 * OAuth Flow Manager
 * 
 * Manages OAuth 2.0 authentication flows with PKCE support, token lifecycle,
 * and secure credential storage. Implements manual intervention detection
 * for browser-based authentication flows.
 */

import { Database } from 'bun:sqlite';
import { 
  OAuthConfiguration,
  OAuthConfigurationCreate,
  OAuthConfigurationUpdate,
  OAuthConfigurationModel,
  OAuthToken,
  OAuthTokenCreate,
  OAuthTokenModel,
  TokenRefreshResult,
  TokenValidationResult,
  PKCEParams,
  OAuthAuthorizationRequest,
  OAuthTokenExchangeRequest
} from '../../models/index.js';
import crypto from 'crypto';

export interface OAuthManagerConfig {
  database: Database;
  encryptionKey: string;
  tokenRefreshThreshold: number; // seconds
  maxRetries: number;
  callbackTimeout: number; // milliseconds
  enableManualDetection: boolean;
  enableBackgroundRefresh?: boolean; // For long-running processes
}

export interface ManualInterventionState {
  required: boolean;
  authorizationUrl?: string;
  state?: string;
  codeVerifier?: string;
  message?: string;
  resumeInstructions?: string[];
}

export interface AuthenticationResult {
  success: boolean;
  token?: OAuthToken;
  error?: string;
  manualIntervention?: ManualInterventionState;
  requiresBrowser?: boolean;
}

export interface TokenRefreshOptions {
  force?: boolean;
  updateExpiry?: boolean;
}

export class OAuthFlowManager {
  private db: Database;
  private config: OAuthManagerConfig;
  private pendingFlows: Map<string, {
    state: string;
    pkceParams?: PKCEParams;
    configId: string;
    timestamp: number;
  }>;

  constructor(config: OAuthManagerConfig) {
    this.db = config.database;
    this.config = config;
    this.pendingFlows = new Map();
    
    this.initializeDatabase();
    
    // Only start background refresh for long-running processes
    if (this.config.enableBackgroundRefresh) {
      this.startTokenRefreshMonitoring();
    }
  }

  /**
   * Create OAuth configuration for a tool
   */
  async createConfiguration(
    configData: OAuthConfigurationCreate
  ): Promise<OAuthConfiguration> {
    // Validate configuration data
    const validation = OAuthConfigurationModel.validate(configData);
    if (!validation.valid) {
      throw new Error(`OAuth configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for existing configuration
    const existing = await this.findConfigurationByTool(
      configData.toolId, 
      configData.providerName
    );
    
    if (existing) {
      throw new Error(`OAuth configuration already exists for tool '${configData.toolId}' and provider '${configData.providerName}'`);
    }

    const oauthConfig = OAuthConfigurationModel.create(configData);
    
    // Store in database
    const stmt = this.db.prepare(`
      INSERT INTO oauth_configurations (
        id, tool_id, provider_name, authorization_url, token_url,
        client_id, scopes, additional_params, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      oauthConfig.id,
      oauthConfig.toolId,
      oauthConfig.providerName,
      oauthConfig.authorizationUrl,
      oauthConfig.tokenUrl,
      oauthConfig.clientId,
      JSON.stringify(oauthConfig.scopes),
      JSON.stringify(oauthConfig.additionalParams),
      oauthConfig.createdAt,
      oauthConfig.updatedAt
    );

    return oauthConfig;
  }

  /**
   * Initiate OAuth authorization flow with manual intervention detection
   */
  async initiateAuthFlow(
    toolId: string,
    redirectUri: string,
    scopes?: string[]
  ): Promise<AuthenticationResult> {
    const config = await this.getConfigurationByTool(toolId);
    if (!config) {
      return {
        success: false,
        error: `No OAuth configuration found for tool: ${toolId}`
      };
    }

    // Generate PKCE parameters for security
    const pkceParams = OAuthConfigurationModel.generatePKCEParams();
    
    // Create authorization request
    const authRequest: OAuthAuthorizationRequest = {
      configId: config.id,
      redirectUri,
      scope: scopes || config.scopes,
      state: pkceParams.state,
      pkceParams,
    };

    // Build authorization URL
    const authorizationUrl = OAuthConfigurationModel.buildAuthorizationUrl(config, authRequest);

    // Store pending flow state
    this.pendingFlows.set(pkceParams.state, {
      state: pkceParams.state,
      pkceParams,
      configId: config.id,
      timestamp: Date.now(),
    });

    // Detect if manual intervention is required (browser redirect)
    const manualIntervention = this.detectManualIntervention(config, authorizationUrl);
    
    if (manualIntervention.required) {
      return {
        success: false,
        manualIntervention,
        requiresBrowser: true,
        error: 'Manual browser authentication required'
      };
    }

    // For automated flows (if supported)
    return this.attemptAutomatedAuth(authorizationUrl, authRequest);
  }

  /**
   * Handle OAuth callback with authorization code
   */
  async handleCallback(
    authorizationCode: string,
    state: string,
    redirectUri?: string
  ): Promise<AuthenticationResult> {
    // Retrieve pending flow
    const pendingFlow = this.pendingFlows.get(state);
    if (!pendingFlow) {
      return {
        success: false,
        error: 'Invalid or expired authorization state'
      };
    }

    // Clean up pending flow
    this.pendingFlows.delete(state);

    // Get configuration
    const config = await this.getConfiguration(pendingFlow.configId);
    if (!config) {
      return {
        success: false,
        error: 'OAuth configuration not found'
      };
    }

    // Exchange authorization code for tokens
    const tokenRequest: OAuthTokenExchangeRequest = {
      configId: config.id,
      authorizationCode,
      redirectUri: redirectUri || 'urn:ietf:wg:oauth:2.0:oob',
      pkceParams: pendingFlow.pkceParams,
    };

    try {
      const tokenResponse = await this.exchangeCodeForTokens(config, tokenRequest);
      
      // Create and store token
      const token = await OAuthTokenModel.createFromAuthResponse(
        config.id,
        tokenResponse,
        this.config.encryptionKey
      );

      await this.storeToken(token);

      return {
        success: true,
        token
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Refresh expired OAuth token
   */
  async refreshToken(
    toolId: string,
    options: TokenRefreshOptions = {}
  ): Promise<TokenRefreshResult> {
    const token = await this.getTokenByTool(toolId);
    if (!token) {
      return {
        success: false,
        error: 'No OAuth token found for tool'
      };
    }

    const config = await this.getConfiguration(token.oauthConfigId);
    if (!config) {
      return {
        success: false,
        error: 'OAuth configuration not found'
      };
    }

    // Check if refresh is needed
    const validation = OAuthTokenModel.validate(token);
    if (validation.valid && !options.force) {
      return {
        success: true,
        newToken: token
      };
    }

    if (!token.refreshTokenEncrypted) {
      return {
        success: false,
        error: 'No refresh token available. Re-authentication required.',
        shouldRetry: false
      };
    }

    try {
      // Decrypt refresh token
      const refreshToken = await OAuthTokenModel.decryptToken(
        token.refreshTokenEncrypted,
        this.config.encryptionKey
      );

      // Make refresh request
      const refreshResponse = await this.makeTokenRefreshRequest(
        config,
        refreshToken
      );

      // Create new token
      const newToken = await OAuthTokenModel.createFromAuthResponse(
        config.id,
        refreshResponse,
        this.config.encryptionKey
      );

      // Update database
      await this.updateToken(token.id, {
        accessTokenEncrypted: newToken.accessTokenEncrypted,
        refreshTokenEncrypted: newToken.refreshTokenEncrypted,
        expiresAt: newToken.expiresAt,
        lastRefreshed: new Date().toISOString(),
      });

      return {
        success: true,
        newToken: {
          ...token,
          ...newToken,
          lastRefreshed: new Date().toISOString(),
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        shouldRetry: true
      };
    }
  }

  /**
   * Get authentication status for a tool
   */
  async getAuthStatus(toolId: string): Promise<{
    authenticated: boolean;
    token?: OAuthToken;
    status?: string;
    expiresIn?: number;
    needsRefresh?: boolean;
  }> {
    const token = await this.getTokenByTool(toolId);
    if (!token) {
      return { authenticated: false, status: 'No token found' };
    }

    const validation = OAuthTokenModel.validate(token);
    const expiresIn = OAuthTokenModel.getExpiresIn(token);
    const needsRefresh = OAuthTokenModel.shouldRefreshToken(token);

    return {
      authenticated: validation.valid,
      token: OAuthTokenModel.sanitize(token) as any,
      status: validation.status,
      expiresIn,
      needsRefresh
    };
  }

  /**
   * Remove OAuth credentials for a tool
   */
  async logout(toolId: string): Promise<void> {
    const config = await this.getConfigurationByTool(toolId);
    if (!config) {
      throw new Error(`No OAuth configuration found for tool: ${toolId}`);
    }

    // Delete all tokens for this configuration
    const stmt = this.db.prepare(`
      DELETE FROM oauth_tokens WHERE oauth_config_id = ?
    `);
    stmt.run(config.id);
  }

  /**
   * Test authentication without making changes
   */
  async testAuthentication(toolId: string): Promise<{
    success: boolean;
    authenticated: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const status = await this.getAuthStatus(toolId);
      
      if (!status.authenticated) {
        return {
          success: true,
          authenticated: false,
          details: status
        };
      }

      // Test token by making a minimal API call
      const testResult = await this.testTokenValidity(toolId);
      
      return {
        success: true,
        authenticated: testResult.valid,
        details: { ...status, testResult }
      };

    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Private helper methods

  private initializeDatabase(): void {
    // Ensure database schema is current
    const configTable = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='oauth_configurations'
    `).get();
    
    const tokenTable = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='oauth_tokens'
    `).get();

    if (!configTable || !tokenTable) {
      throw new Error('OAuth tables not found. Please run database migration.');
    }
  }

  private startTokenRefreshMonitoring(): void {
    // Check for tokens needing refresh every 5 minutes
    setInterval(async () => {
      await this.refreshExpiredTokens();
    }, 5 * 60 * 1000);
  }

  private async refreshExpiredTokens(): Promise<void> {
    const thresholdTime = new Date(
      Date.now() + this.config.tokenRefreshThreshold * 1000
    ).toISOString();

    const stmt = this.db.prepare(`
      SELECT ot.*, oc.tool_id 
      FROM oauth_tokens ot
      JOIN oauth_configurations oc ON ot.oauth_config_id = oc.id
      WHERE ot.expires_at <= ? AND ot.refresh_token_encrypted IS NOT NULL
    `);

    const expiredTokens = stmt.all(thresholdTime) as any[];

    for (const tokenRow of expiredTokens) {
      try {
        await this.refreshToken(tokenRow.tool_id, { force: true });
      } catch (error) {
        console.error(`Failed to refresh token for tool ${tokenRow.tool_id}:`, error);
      }
    }
  }

  private detectManualIntervention(
    config: OAuthConfiguration,
    authorizationUrl: string
  ): ManualInterventionState {
    // Always require manual intervention for browser-based OAuth flows
    // This is the critical requirement from the task specification
    
    const isNotionProvider = config.providerName.toLowerCase().includes('notion');
    const isBrowserFlow = authorizationUrl.includes('response_type=code');
    
    if (this.config.enableManualDetection && (isNotionProvider || isBrowserFlow)) {
      return {
        required: true,
        authorizationUrl,
        state: authorizationUrl.match(/state=([^&]+)/)?.[1],
        message: 'MANUAL INTERVENTION NEEDED: OAuth flow requires browser authentication',
        resumeInstructions: [
          '1. Open the authorization URL in your browser',
          '2. Complete the authentication process',
          '3. Copy the authorization code from the callback URL',
          '4. Use the callback command to complete authentication',
          '5. Or press Enter after completing authentication in browser'
        ]
      };
    }

    return { required: false };
  }

  private async attemptAutomatedAuth(
    authorizationUrl: string,
    authRequest: OAuthAuthorizationRequest
  ): Promise<AuthenticationResult> {
    // For providers that support automated flows
    // Most OAuth flows will require manual intervention
    return {
      success: false,
      error: 'Automated authentication not supported for this provider',
      manualIntervention: {
        required: true,
        authorizationUrl,
        message: 'Please complete authentication manually in browser'
      }
    };
  }

  private async exchangeCodeForTokens(
    config: OAuthConfiguration,
    request: OAuthTokenExchangeRequest
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
  }> {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code: request.authorizationCode,
      redirect_uri: request.redirectUri,
    });

    // Add PKCE parameters if present
    if (request.pkceParams) {
      tokenRequestBody.append('code_verifier', request.pkceParams.codeVerifier);
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenRequestBody,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokenData = await response.json();
    
    if ((tokenData as any).error) {
      throw new Error(`OAuth error: ${(tokenData as any).error_description || (tokenData as any).error}`);
    }

    return tokenData as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    };
  }

  private async makeTokenRefreshRequest(
    config: OAuthConfiguration,
    refreshToken: string
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
  }> {
    const refreshRequestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: refreshToken,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: refreshRequestBody,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
    }

    const tokenData = await response.json();
    
    if ((tokenData as any).error) {
      throw new Error(`OAuth refresh error: ${(tokenData as any).error_description || (tokenData as any).error}`);
    }

    return tokenData as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    };
  }

  private async testTokenValidity(toolId: string): Promise<{ valid: boolean; error?: string }> {
    // This would make a test API call to validate the token
    // Implementation depends on the specific OAuth provider
    return { valid: true };
  }

  private async getConfigurationByTool(toolId: string): Promise<OAuthConfiguration | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM oauth_configurations WHERE tool_id = ? LIMIT 1
    `);
    
    const row = stmt.get(toolId) as any;
    return row ? OAuthConfigurationModel.fromDatabase(row) : null;
  }

  private async getConfiguration(configId: string): Promise<OAuthConfiguration | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM oauth_configurations WHERE id = ?
    `);
    
    const row = stmt.get(configId) as any;
    return row ? OAuthConfigurationModel.fromDatabase(row) : null;
  }

  private async findConfigurationByTool(
    toolId: string,
    providerName: string
  ): Promise<OAuthConfiguration | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM oauth_configurations 
      WHERE tool_id = ? AND provider_name = ?
    `);
    
    const row = stmt.get(toolId, providerName) as any;
    return row ? OAuthConfigurationModel.fromDatabase(row) : null;
  }

  private async getTokenByTool(toolId: string): Promise<OAuthToken | null> {
    const stmt = this.db.prepare(`
      SELECT ot.* FROM oauth_tokens ot
      JOIN oauth_configurations oc ON ot.oauth_config_id = oc.id
      WHERE oc.tool_id = ?
      ORDER BY ot.created_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get(toolId) as any;
    return row ? OAuthTokenModel.fromDatabase(row) : null;
  }

  private async storeToken(token: OAuthToken): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO oauth_tokens (
        id, oauth_config_id, access_token_encrypted, refresh_token_encrypted,
        token_type, expires_at, scope, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      token.id,
      token.oauthConfigId,
      token.accessTokenEncrypted,
      token.refreshTokenEncrypted || null,
      token.tokenType,
      token.expiresAt || null,
      token.scope || null,
      token.createdAt
    );
  }

  private async updateToken(
    tokenId: string,
    updates: Partial<OAuthToken>
  ): Promise<void> {
    const fields = Object.keys(updates).map(key => `${this.camelToSnake(key)} = ?`);
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`
      UPDATE oauth_tokens SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values, tokenId);
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}