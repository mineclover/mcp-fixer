import { z } from 'zod';
import { Credential } from '../../models/credential.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';
export type AuthType = 'api_key' | 'bearer' | 'basic' | 'oauth';
declare const ApiKeyDataSchema: z.ZodObject<{
    apiKey: z.ZodString;
    header: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    header: string;
    apiKey: string;
}, {
    apiKey: string;
    header?: string | undefined;
}>;
declare const BearerTokenDataSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
declare const BasicAuthDataSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
declare const OAuthDataSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenType: z.ZodDefault<z.ZodString>;
    expiresIn: z.ZodOptional<z.ZodNumber>;
    scope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    tokenType: string;
    refreshToken?: string | undefined;
    scope?: string | undefined;
    expiresIn?: number | undefined;
}, {
    accessToken: string;
    refreshToken?: string | undefined;
    tokenType?: string | undefined;
    scope?: string | undefined;
    expiresIn?: number | undefined;
}>;
export type ApiKeyData = z.infer<typeof ApiKeyDataSchema>;
export type BearerTokenData = z.infer<typeof BearerTokenDataSchema>;
export type BasicAuthData = z.infer<typeof BasicAuthDataSchema>;
export type OAuthData = z.infer<typeof OAuthDataSchema>;
export type CredentialData = ApiKeyData | BearerTokenData | BasicAuthData | OAuthData;
declare const AuthTestResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    responseTime: z.ZodOptional<z.ZodNumber>;
    statusCode: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    statusCode?: number | undefined;
    responseTime?: number | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    statusCode?: number | undefined;
    responseTime?: number | undefined;
}>;
export type AuthTestResult = z.infer<typeof AuthTestResultSchema>;
export declare class AuthManager {
    private db;
    private config;
    private masterKey;
    private keyCache;
    constructor(db: DatabaseManager, config: ConfigManager);
    /**
     * Initialize authentication system
     */
    initialize(): Promise<void>;
    /**
     * Store credentials for a tool
     */
    storeCredentials(toolId: string, authType: AuthType, data: CredentialData, expiresAt?: Date): Promise<Credential>;
    /**
     * Retrieve and decrypt credentials for a tool
     */
    getCredentials(toolId: string): Promise<{
        credential: Credential;
        data: CredentialData;
    } | null>;
    /**
     * Remove credentials for a tool
     */
    removeCredentials(toolId: string): Promise<boolean>;
    /**
     * List all stored credentials (without sensitive data)
     */
    listCredentials(toolId?: string): Promise<Array<{
        id: string;
        toolId: string;
        authType: AuthType;
        createdAt: string;
        expiresAt?: string;
        lastUsed?: string;
        usageCount: number;
        isExpired: boolean;
        isExpiringSoon: boolean;
    }>>;
    /**
     * Test credentials by making a request to the tool
     */
    testCredentials(toolId: string, endpoint: string): Promise<AuthTestResult>;
    /**
     * Create authentication headers for HTTP requests
     */
    createAuthHeaders(authType: AuthType, data: CredentialData): Record<string, string>;
    /**
     * Rotate master key (re-encrypt all credentials)
     */
    rotateMasterKey(): Promise<{
        success: boolean;
        reencrypted: number;
        errors: string[];
    }>;
    /**
     * Get authentication statistics
     */
    getStats(): Promise<{
        totalCredentials: number;
        credentialsByType: Record<AuthType, number>;
        expiredCredentials: number;
        expiringSoonCredentials: number;
        averageUsageCount: number;
    }>;
    private ensureMasterKey;
    private generateMasterKey;
    private saveMasterKey;
    private encryptMasterKey;
    private decryptMasterKey;
    private getSystemKey;
    private validateCredentialData;
    private encryptCredentialData;
    private decryptCredentialData;
    private encryptWithKey;
    private decryptWithKey;
    private updateCredentialUsage;
    private cleanupExpiredCredentials;
}
export {};
//# sourceMappingURL=auth-manager.d.ts.map