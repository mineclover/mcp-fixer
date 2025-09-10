import { z } from 'zod';
// OAuth token types
export const TokenTypeSchema = z.enum(['Bearer', 'Basic']);
// Token status enumeration
export const TokenStatusSchema = z.enum(['valid', 'expired', 'expiring_soon', 'invalid', 'refreshing']);
// Encrypted token data (stored form)
export const EncryptedTokenDataSchema = z.object({
    encryptedData: z.string(),
    iv: z.string(),
    salt: z.string(),
    algorithm: z.string().default('aes-256-gcm'),
});
// Decrypted token data (runtime form)
export const DecryptedTokenDataSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    tokenType: TokenTypeSchema.default('Bearer'),
    expiresIn: z.number().optional(), // seconds
    scope: z.string().optional(),
});
// OAuth token core schema
export const OAuthTokenSchema = z.object({
    id: z.string().uuid(),
    oauthConfigId: z.string().uuid(),
    accessTokenEncrypted: z.string(),
    refreshTokenEncrypted: z.string().optional(),
    tokenType: TokenTypeSchema.default('Bearer'),
    expiresAt: z.string().datetime().optional(),
    scope: z.string().optional(),
    createdAt: z.string().datetime(),
    lastRefreshed: z.string().datetime().optional(),
});
// OAuth token creation input
export const OAuthTokenCreateSchema = OAuthTokenSchema.omit({
    id: true,
    createdAt: true,
});
// OAuth token update input
export const OAuthTokenUpdateSchema = OAuthTokenSchema.partial().omit({
    id: true,
    oauthConfigId: true,
    createdAt: true,
});
// Token refresh request
export const TokenRefreshRequestSchema = z.object({
    tokenId: z.string().uuid(),
    forceRefresh: z.boolean().default(false),
});
// Token refresh result
export const TokenRefreshResultSchema = z.object({
    success: z.boolean(),
    newToken: OAuthTokenSchema.optional(),
    error: z.string().optional(),
    shouldRetry: z.boolean().default(false),
});
// Token validation result
export const TokenValidationResultSchema = z.object({
    valid: z.boolean(),
    status: TokenStatusSchema,
    expiresIn: z.number().optional(), // seconds until expiry
    errors: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    needsRefresh: z.boolean().default(false),
});
// Token usage context
export const TokenUsageContextSchema = z.object({
    tokenId: z.string().uuid(),
    operation: z.string(),
    timestamp: z.string().datetime(),
    success: z.boolean(),
    errorMessage: z.string().optional(),
});
// Token list filters
export const OAuthTokenListFiltersSchema = z.object({
    oauthConfigId: z.string().uuid().optional(),
    tokenType: TokenTypeSchema.optional(),
    status: TokenStatusSchema.optional(),
    expiringWithin: z.number().optional(), // hours
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
}).partial();
// Token statistics
export const OAuthTokenStatsSchema = z.object({
    totalTokens: z.number(),
    validTokens: z.number(),
    expiredTokens: z.number(),
    expiringTokens: z.number(), // expiring within 1 hour
    refreshableTokens: z.number(),
    averageLifetime: z.number().optional(), // seconds
    refreshSuccessRate: z.number().min(0).max(1).optional(),
});
// Encryption configuration
export const EncryptionConfigSchema = z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyDerivation: z.string().default('pbkdf2'),
    keyDerivationRounds: z.number().default(100000),
    saltLength: z.number().default(32),
    ivLength: z.number().default(16),
});
// Utility functions and encryption logic
export class OAuthTokenModel {
    static DEFAULT_EXPIRY_THRESHOLD_HOURS = 1;
    static ENCRYPTION_CONFIG = {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        keyDerivationRounds: 100000,
        saltLength: 32,
        ivLength: 16,
    };
    /**
     * Validates an OAuth token against the schema
     */
    static validate(token) {
        try {
            OAuthTokenSchema.parse(token);
            const oauthToken = token;
            const status = this.getTokenStatus(oauthToken);
            const expiresIn = this.getExpiresIn(oauthToken);
            const needsRefresh = this.shouldRefreshToken(oauthToken);
            return {
                valid: status !== 'invalid',
                status,
                expiresIn,
                errors: [],
                warnings: status === 'expiring_soon' ? ['Token expires soon'] : [],
                needsRefresh,
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    status: 'invalid',
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                    warnings: [],
                    needsRefresh: false,
                };
            }
            return {
                valid: false,
                status: 'invalid',
                errors: [String(error)],
                warnings: [],
                needsRefresh: false,
            };
        }
    }
    /**
     * Validates token creation input
     */
    static validateCreate(tokenData) {
        try {
            OAuthTokenCreateSchema.parse(tokenData);
            return {
                valid: true,
                status: 'valid',
                errors: [],
                warnings: [],
                needsRefresh: false,
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    status: 'invalid',
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                    warnings: [],
                    needsRefresh: false,
                };
            }
            return {
                valid: false,
                status: 'invalid',
                errors: [String(error)],
                warnings: [],
                needsRefresh: false,
            };
        }
    }
    /**
     * Creates a new OAuth token with encrypted data
     */
    static async create(tokenData, decryptedData, encryptionKey) {
        const now = new Date().toISOString();
        const accessTokenEncrypted = await this.encryptToken(decryptedData.accessToken, encryptionKey);
        const refreshTokenEncrypted = decryptedData.refreshToken
            ? await this.encryptToken(decryptedData.refreshToken, encryptionKey)
            : undefined;
        return {
            id: crypto.randomUUID(),
            createdAt: now,
            ...tokenData,
            accessTokenEncrypted,
            refreshTokenEncrypted,
        };
    }
    /**
     * Updates an OAuth token with new data
     */
    static update(existingToken, updateData) {
        return {
            ...existingToken,
            ...updateData,
        };
    }
    /**
     * Determines the current status of a token
     */
    static getTokenStatus(token) {
        if (!token.expiresAt) {
            return 'valid'; // No expiration date
        }
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        if (expiresAt <= now) {
            return 'expired';
        }
        else if (expiresAt <= oneHourFromNow) {
            return 'expiring_soon';
        }
        else {
            return 'valid';
        }
    }
    /**
     * Gets seconds until token expires
     */
    static getExpiresIn(token) {
        if (!token.expiresAt) {
            return undefined;
        }
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        const secondsUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return secondsUntilExpiry;
    }
    /**
     * Determines if token should be refreshed
     */
    static shouldRefreshToken(token, thresholdHours = OAuthTokenModel.DEFAULT_EXPIRY_THRESHOLD_HOURS) {
        if (!token.refreshTokenEncrypted) {
            return false; // Cannot refresh without refresh token
        }
        const status = this.getTokenStatus(token);
        return status === 'expired' || status === 'expiring_soon';
    }
    /**
     * Checks if token has been recently refreshed
     */
    static wasRecentlyRefreshed(token, thresholdMinutes = 5) {
        if (!token.lastRefreshed) {
            return false;
        }
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        return new Date(token.lastRefreshed) > threshold;
    }
    /**
     * Encrypts token data using AES-256-GCM
     */
    static async encryptToken(tokenData, encryptionKey) {
        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(this.ENCRYPTION_CONFIG.saltLength));
        const iv = crypto.getRandomValues(new Uint8Array(this.ENCRYPTION_CONFIG.ivLength));
        // In a real implementation, use Node.js crypto or Web Crypto API
        // This is a placeholder implementation
        const encrypted = btoa(JSON.stringify({
            data: tokenData,
            salt: Array.from(salt).join(','),
            iv: Array.from(iv).join(','),
            algorithm: this.ENCRYPTION_CONFIG.algorithm,
        }));
        return encrypted;
    }
    /**
     * Decrypts token data using AES-256-GCM
     */
    static async decryptToken(encryptedData, encryptionKey) {
        try {
            // In a real implementation, use proper decryption
            // This is a placeholder implementation
            const parsed = JSON.parse(atob(encryptedData));
            return parsed.data;
        }
        catch (error) {
            throw new Error(`Failed to decrypt token: ${error}`);
        }
    }
    /**
     * Creates token from OAuth authorization response
     */
    static async createFromAuthResponse(oauthConfigId, authResponse, encryptionKey) {
        const now = new Date();
        const expiresAt = authResponse.expires_in
            ? new Date(now.getTime() + authResponse.expires_in * 1000).toISOString()
            : undefined;
        const decryptedData = {
            accessToken: authResponse.access_token,
            refreshToken: authResponse.refresh_token,
            tokenType: authResponse.token_type || 'Bearer',
            expiresIn: authResponse.expires_in,
            scope: authResponse.scope,
        };
        return this.create({
            oauthConfigId,
            tokenType: decryptedData.tokenType,
            expiresAt,
            scope: decryptedData.scope,
        }, decryptedData, encryptionKey);
    }
    /**
     * Converts database row to OAuthToken object
     */
    static fromDatabase(row) {
        return {
            id: row.id,
            oauthConfigId: row.oauth_config_id,
            accessTokenEncrypted: row.access_token_encrypted,
            refreshTokenEncrypted: row.refresh_token_encrypted || undefined,
            tokenType: row.token_type,
            expiresAt: row.expires_at || undefined,
            scope: row.scope || undefined,
            createdAt: row.created_at,
            lastRefreshed: row.last_refreshed || undefined,
        };
    }
    /**
     * Converts OAuthToken object to database row format
     */
    static toDatabase(token) {
        return {
            id: token.id,
            oauth_config_id: token.oauthConfigId,
            access_token_encrypted: token.accessTokenEncrypted,
            refresh_token_encrypted: token.refreshTokenEncrypted || null,
            token_type: token.tokenType,
            expires_at: token.expiresAt || null,
            scope: token.scope || null,
            created_at: token.createdAt,
            last_refreshed: token.lastRefreshed || null,
        };
    }
    /**
     * Sanitizes token for API responses (removes encrypted data)
     */
    static sanitize(token) {
        const { accessTokenEncrypted, refreshTokenEncrypted, ...sanitizedToken } = token;
        return {
            ...sanitizedToken,
            hasAccessToken: Boolean(accessTokenEncrypted),
            hasRefreshToken: Boolean(refreshTokenEncrypted),
            status: this.getTokenStatus(token),
            expiresIn: this.getExpiresIn(token),
        };
    }
    /**
     * Generates authorization header value from token
     */
    static async getAuthorizationHeader(token, encryptionKey) {
        const decryptedAccessToken = await this.decryptToken(token.accessTokenEncrypted, encryptionKey);
        return `${token.tokenType} ${decryptedAccessToken}`;
    }
    /**
     * Validates token is ready for use
     */
    static isUsable(token) {
        const status = this.getTokenStatus(token);
        return status === 'valid' || status === 'expiring_soon';
    }
    /**
     * Gets all tokens requiring refresh
     */
    static filterTokensNeedingRefresh(tokens) {
        return tokens.filter(token => this.shouldRefreshToken(token));
    }
    /**
     * Gets all tokens expiring within specified hours
     */
    static filterTokensExpiringWithin(tokens, hours) {
        const threshold = new Date(Date.now() + hours * 60 * 60 * 1000);
        return tokens.filter(token => {
            if (!token.expiresAt)
                return false;
            return new Date(token.expiresAt) <= threshold;
        });
    }
}
