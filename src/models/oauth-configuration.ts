import { z } from 'zod';

// OAuth provider settings
export const OAuthProviderSchema = z.enum(['notion', 'google', 'github', 'custom']);
export type OAuthProviderType = z.infer<typeof OAuthProviderSchema>;

// OAuth scopes array
export const ScopesSchema = z.array(z.string()).default([]);

// Additional OAuth parameters
export const AdditionalParamsSchema = z.record(z.string(), z.any()).default({});

// OAuth configuration core schema
export const OAuthConfigurationSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  providerName: z.string().min(1).max(100),
  authorizationUrl: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'Authorization URL must use HTTPS'
  }),
  tokenUrl: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'Token URL must use HTTPS'
  }),
  clientId: z.string().min(1).max(255),
  scopes: ScopesSchema,
  additionalParams: AdditionalParamsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OAuthConfiguration = z.infer<typeof OAuthConfigurationSchema>;

// OAuth configuration creation input
export const OAuthConfigurationCreateSchema = OAuthConfigurationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type OAuthConfigurationCreate = z.infer<typeof OAuthConfigurationCreateSchema>;

// OAuth configuration update input
export const OAuthConfigurationUpdateSchema = OAuthConfigurationSchema.partial().omit({
  id: true,
  toolId: true,
  createdAt: true,
});
export type OAuthConfigurationUpdate = z.infer<typeof OAuthConfigurationUpdateSchema>;

// OAuth configuration validation result
export const OAuthConfigurationValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  urlsValid: z.boolean(),
  scopesValid: z.boolean(),
});
export type OAuthConfigurationValidationResult = z.infer<typeof OAuthConfigurationValidationResultSchema>;

// PKCE (Proof Key for Code Exchange) parameters
export const PKCEParamsSchema = z.object({
  codeVerifier: z.string().min(43).max(128),
  codeChallenge: z.string().min(43).max(128),
  codeChallengeMethod: z.enum(['S256', 'plain']).default('S256'),
  state: z.string().min(10),
});
export type PKCEParams = z.infer<typeof PKCEParamsSchema>;

// OAuth authorization request
export const OAuthAuthorizationRequestSchema = z.object({
  configId: z.string().uuid(),
  redirectUri: z.string().url(),
  scope: z.array(z.string()).optional(),
  state: z.string().optional(),
  pkceParams: PKCEParamsSchema.optional(),
  additionalParams: z.record(z.string(), z.string()).optional(),
});
export type OAuthAuthorizationRequest = z.infer<typeof OAuthAuthorizationRequestSchema>;

// OAuth token exchange request
export const OAuthTokenExchangeRequestSchema = z.object({
  configId: z.string().uuid(),
  authorizationCode: z.string(),
  redirectUri: z.string().url(),
  pkceParams: PKCEParamsSchema.optional(),
});
export type OAuthTokenExchangeRequest = z.infer<typeof OAuthTokenExchangeRequestSchema>;

// OAuth configuration list filters
export const OAuthConfigurationListFiltersSchema = z.object({
  toolId: z.string().uuid().optional(),
  providerName: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
}).partial();
export type OAuthConfigurationListFilters = z.infer<typeof OAuthConfigurationListFiltersSchema>;

// OAuth configuration statistics
export const OAuthConfigurationStatsSchema = z.object({
  totalConfigurations: z.number(),
  configurationsByProvider: z.record(z.string(), z.number()),
  averageTokenLifetime: z.number().optional(), // seconds
  totalTokensIssued: z.number().optional(),
  activeTokens: z.number().optional(),
});
export type OAuthConfigurationStats = z.infer<typeof OAuthConfigurationStatsSchema>;

// OAuth provider settings with predefined configurations
export const OAUTH_PROVIDERS = {
  notion: {
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read_content', 'insert_content'] as string[],
    additionalParams: {
      response_type: 'code',
    },
  },
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'profile', 'email'] as string[],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['user', 'repo'] as string[],
    additionalParams: {},
  },
} as const;

// Utility functions and validation logic
export class OAuthConfigurationModel {
  /**
   * Validates an OAuth configuration against the schema
   */
  static validate(oauthConfig: unknown): OAuthConfigurationValidationResult {
    try {
      OAuthConfigurationSchema.parse(oauthConfig);
      
      const config = oauthConfig as OAuthConfiguration;
      const urlsValid = this.validateUrls(config.authorizationUrl, config.tokenUrl);
      const scopesValid = this.validateScopes(config.scopes);
      
      return {
        valid: urlsValid && scopesValid,
        errors: [],
        warnings: [],
        urlsValid,
        scopesValid,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
          urlsValid: false,
          scopesValid: false,
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
        urlsValid: false,
        scopesValid: false,
      };
    }
  }

  /**
   * Validates creation input for OAuth configuration
   */
  static validateCreate(configData: unknown): OAuthConfigurationValidationResult {
    try {
      OAuthConfigurationCreateSchema.parse(configData);
      return {
        valid: true,
        errors: [],
        warnings: [],
        urlsValid: true,
        scopesValid: true,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
          urlsValid: false,
          scopesValid: false,
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
        urlsValid: false,
        scopesValid: false,
      };
    }
  }

  /**
   * Validates URLs are properly formatted and secure
   */
  private static validateUrls(authUrl: string, tokenUrl: string): boolean {
    try {
      const authUrlObj = new URL(authUrl);
      const tokenUrlObj = new URL(tokenUrl);
      
      return (
        authUrlObj.protocol === 'https:' &&
        tokenUrlObj.protocol === 'https:' &&
        authUrlObj.hostname !== 'localhost' &&
        tokenUrlObj.hostname !== 'localhost'
      );
    } catch {
      return false;
    }
  }

  /**
   * Validates OAuth scopes are reasonable
   */
  private static validateScopes(scopes: string[]): boolean {
    // Check for reasonable scope limits and no suspicious patterns
    return (
      scopes.length <= 20 && // Reasonable scope limit
      scopes.every(scope => 
        typeof scope === 'string' && 
        scope.length <= 100 &&
        /^[a-zA-Z0-9_:.-]+$/.test(scope) // Alphanumeric, underscore, colon, dot, dash
      )
    );
  }

  /**
   * Creates a new OAuth configuration with generated fields
   */
  static create(configData: OAuthConfigurationCreate): OAuthConfiguration {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...configData,
    };
  }

  /**
   * Updates an OAuth configuration with new data
   */
  static update(
    existingConfig: OAuthConfiguration, 
    updateData: OAuthConfigurationUpdate
  ): OAuthConfiguration {
    return {
      ...existingConfig,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Creates OAuth configuration from predefined provider
   */
  static createFromProvider(
    toolId: string,
    provider: keyof typeof OAUTH_PROVIDERS,
    clientId: string,
    customScopes?: string[]
  ): OAuthConfigurationCreate {
    const providerConfig = OAUTH_PROVIDERS[provider];
    
    return {
      toolId,
      providerName: provider,
      authorizationUrl: providerConfig.authorizationUrl,
      tokenUrl: providerConfig.tokenUrl,
      clientId,
      scopes: customScopes || providerConfig.scopes,
      additionalParams: providerConfig.additionalParams,
    };
  }

  /**
   * Generates PKCE parameters for OAuth flow
   */
  static generatePKCEParams(): PKCEParams {
    // Generate code verifier (43-128 characters, URL-safe)
    const codeVerifier = this.generateRandomString(128);
    
    // Generate code challenge (SHA256 of verifier, base64url encoded)
    const codeChallenge = this.sha256Base64Url(codeVerifier);
    
    // Generate state parameter
    const state = this.generateRandomString(32);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
    };
  }

  /**
   * Builds authorization URL with parameters
   */
  static buildAuthorizationUrl(
    config: OAuthConfiguration, 
    request: OAuthAuthorizationRequest
  ): string {
    const url = new URL(config.authorizationUrl);
    
    // Standard OAuth parameters
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', request.redirectUri);
    url.searchParams.set('response_type', 'code');
    
    // Scopes
    const scopes = request.scope || config.scopes;
    if (scopes.length > 0) {
      url.searchParams.set('scope', scopes.join(' '));
    }
    
    // State for CSRF protection
    if (request.state) {
      url.searchParams.set('state', request.state);
    }
    
    // PKCE parameters
    if (request.pkceParams) {
      url.searchParams.set('code_challenge', request.pkceParams.codeChallenge);
      url.searchParams.set('code_challenge_method', request.pkceParams.codeChallengeMethod);
    }
    
    // Additional provider-specific parameters
    Object.entries(config.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
    
    // Request-specific additional parameters
    Object.entries(request.additionalParams || {}).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }

  /**
   * Converts database row to OAuthConfiguration object
   */
  static fromDatabase(row: any): OAuthConfiguration {
    return {
      id: row.id,
      toolId: row.tool_id,
      providerName: row.provider_name,
      authorizationUrl: row.authorization_url,
      tokenUrl: row.token_url,
      clientId: row.client_id,
      scopes: row.scopes ? JSON.parse(row.scopes) : [],
      additionalParams: row.additional_params ? JSON.parse(row.additional_params) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Converts OAuthConfiguration object to database row format
   */
  static toDatabase(config: OAuthConfiguration): Record<string, any> {
    return {
      id: config.id,
      tool_id: config.toolId,
      provider_name: config.providerName,
      authorization_url: config.authorizationUrl,
      token_url: config.tokenUrl,
      client_id: config.clientId,
      scopes: JSON.stringify(config.scopes),
      additional_params: JSON.stringify(config.additionalParams),
      created_at: config.createdAt,
      updated_at: config.updatedAt,
    };
  }

  /**
   * Sanitizes OAuth configuration for API responses (removes sensitive data)
   */
  static sanitize(config: OAuthConfiguration): Omit<OAuthConfiguration, 'clientId'> & { hasClientId: boolean } {
    const { clientId, ...sanitizedConfig } = config;
    return {
      ...sanitizedConfig,
      hasClientId: Boolean(clientId),
    };
  }

  // Helper methods for PKCE and crypto operations
  private static generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }

  private static sha256Base64Url(input: string): string {
    // In a real implementation, use Web Crypto API or Node.js crypto
    // This is a placeholder implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Placeholder - in real implementation, use proper SHA256 and base64url encoding
    return btoa(String.fromCharCode(...data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}