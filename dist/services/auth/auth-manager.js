import { z } from 'zod';
import CryptoJS from 'crypto-js';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CredentialModel } from '../../models/credential.js';
// Credential data schemas
const ApiKeyDataSchema = z.object({
    apiKey: z.string().min(1),
    header: z.string().default('X-API-Key'),
});
const BearerTokenDataSchema = z.object({
    token: z.string().min(1),
});
const BasicAuthDataSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});
const OAuthDataSchema = z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().optional(),
    tokenType: z.string().default('Bearer'),
    expiresIn: z.number().optional(),
    scope: z.string().optional(),
});
// Test result schema
const AuthTestResultSchema = z.object({
    success: z.boolean(),
    responseTime: z.number().optional(),
    statusCode: z.number().optional(),
    error: z.string().optional(),
});
export class AuthManager {
    db;
    config;
    masterKey = null;
    keyCache = new Map();
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    /**
     * Initialize authentication system
     */
    async initialize() {
        // Ensure master key exists
        await this.ensureMasterKey();
        // Clean up expired credentials
        await this.cleanupExpiredCredentials();
    }
    /**
     * Store credentials for a tool
     */
    async storeCredentials(toolId, authType, data, expiresAt) {
        // Validate input data based on auth type
        const validatedData = this.validateCredentialData(authType, data);
        // Encrypt the credential data
        const encryptedData = await this.encryptCredentialData(validatedData);
        // Create credential record
        const credentialData = {
            toolId,
            authType,
            encryptedData: encryptedData.data,
            encryptionKeyId: encryptedData.keyId,
            expiresAt: expiresAt?.toISOString(),
        };
        const credential = CredentialModel.create(credentialData);
        // Save to database
        const dbData = CredentialModel.toDatabase(credential);
        const stmt = this.db.prepare(`
      INSERT INTO credentials (
        id, tool_id, auth_type, encrypted_data, encryption_key_id,
        expires_at, created_at, last_used, usage_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(dbData.id, dbData.tool_id, dbData.auth_type, dbData.encrypted_data, dbData.encryption_key_id, dbData.expires_at, dbData.created_at, dbData.last_used, dbData.usage_count);
        return credential;
    }
    /**
     * Retrieve and decrypt credentials for a tool
     */
    async getCredentials(toolId) {
        try {
            const row = this.db.prepare(`
        SELECT * FROM credentials 
        WHERE tool_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(toolId);
            if (!row) {
                return null;
            }
            const credential = CredentialModel.fromDatabase(row);
            // Decrypt credential data
            const decryptedData = await this.decryptCredentialData(credential.encryptedData, credential.encryptionKeyId);
            // Update usage statistics
            await this.updateCredentialUsage(credential.id);
            return {
                credential,
                data: decryptedData,
            };
        }
        catch (error) {
            throw new Error(`Failed to retrieve credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Remove credentials for a tool
     */
    async removeCredentials(toolId) {
        try {
            const stmt = this.db.prepare('DELETE FROM credentials WHERE tool_id = ?');
            const result = stmt.run(toolId);
            return result.changes > 0;
        }
        catch (error) {
            throw new Error(`Failed to remove credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List all stored credentials (without sensitive data)
     */
    async listCredentials(toolId) {
        try {
            let query = `
        SELECT 
          id, tool_id, auth_type, created_at, expires_at, 
          last_used, usage_count,
          CASE 
            WHEN expires_at IS NOT NULL AND expires_at <= datetime('now') THEN 1 
            ELSE 0 
          END as is_expired,
          CASE 
            WHEN expires_at IS NOT NULL AND expires_at <= datetime('now', '+7 days') AND expires_at > datetime('now') THEN 1 
            ELSE 0 
          END as is_expiring_soon
        FROM credentials
      `;
            const params = [];
            if (toolId) {
                query += ' WHERE tool_id = ?';
                params.push(toolId);
            }
            query += ' ORDER BY created_at DESC';
            const rows = this.db.prepare(query).all(...params);
            return rows.map(row => ({
                id: row.id,
                toolId: row.tool_id,
                authType: row.auth_type,
                createdAt: row.created_at,
                expiresAt: row.expires_at || undefined,
                lastUsed: row.last_used || undefined,
                usageCount: row.usage_count,
                isExpired: Boolean(row.is_expired),
                isExpiringSoon: Boolean(row.is_expiring_soon),
            }));
        }
        catch (error) {
            throw new Error(`Failed to list credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Test credentials by making a request to the tool
     */
    async testCredentials(toolId, endpoint) {
        const startTime = Date.now();
        try {
            const credentialInfo = await this.getCredentials(toolId);
            if (!credentialInfo) {
                return {
                    success: false,
                    error: 'No credentials found for tool',
                    responseTime: Date.now() - startTime,
                };
            }
            // Create authentication headers
            const headers = this.createAuthHeaders(credentialInfo.credential.authType, credentialInfo.data);
            // Make test request
            const response = await fetch(`${endpoint}/health`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });
            return {
                success: response.ok,
                responseTime: Date.now() - startTime,
                statusCode: response.status,
                error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
            };
        }
        catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Create authentication headers for HTTP requests
     */
    createAuthHeaders(authType, data) {
        const headers = {};
        switch (authType) {
            case 'api_key':
                const apiKeyData = data;
                headers[apiKeyData.header] = apiKeyData.apiKey;
                break;
            case 'bearer':
                const bearerData = data;
                headers['Authorization'] = `Bearer ${bearerData.token}`;
                break;
            case 'basic':
                const basicData = data;
                const credentials = Buffer.from(`${basicData.username}:${basicData.password}`).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
                break;
            case 'oauth':
                const oauthData = data;
                headers['Authorization'] = `${oauthData.tokenType} ${oauthData.accessToken}`;
                break;
            default:
                throw new Error(`Unsupported authentication type: ${authType}`);
        }
        return headers;
    }
    /**
     * Rotate master key (re-encrypt all credentials)
     */
    async rotateMasterKey() {
        const errors = [];
        let reencrypted = 0;
        try {
            // Generate new master key
            const newMasterKey = this.generateMasterKey();
            const oldMasterKey = this.masterKey;
            if (!oldMasterKey) {
                throw new Error('No existing master key found');
            }
            // Get all credentials
            const credentials = this.db.prepare('SELECT * FROM credentials').all();
            // Begin transaction
            this.db.transaction(() => {
                for (const credRow of credentials) {
                    try {
                        const credential = CredentialModel.fromDatabase(credRow);
                        // Decrypt with old key
                        const decryptedData = this.decryptWithKey(credential.encryptedData, oldMasterKey);
                        // Encrypt with new key
                        const encryptedData = this.encryptWithKey(decryptedData, newMasterKey);
                        // Update in database
                        const stmt = this.db.prepare(`
              UPDATE credentials 
              SET encrypted_data = ?, encryption_key_id = ?, updated_at = ?
              WHERE id = ?
            `);
                        stmt.run(encryptedData, 'master', new Date().toISOString(), credential.id);
                        reencrypted++;
                    }
                    catch (error) {
                        errors.push(`Failed to rotate key for credential ${credRow.id}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            })();
            // Save new master key
            this.masterKey = newMasterKey;
            await this.saveMasterKey(newMasterKey);
            return { success: errors.length === 0, reencrypted, errors };
        }
        catch (error) {
            errors.push(`Master key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, reencrypted, errors };
        }
    }
    /**
     * Get authentication statistics
     */
    async getStats() {
        try {
            const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM credentials').get();
            const typeResults = this.db.prepare(`
        SELECT auth_type, COUNT(*) as count 
        FROM credentials 
        GROUP BY auth_type
      `).all();
            const expiredResult = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM credentials 
        WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
      `).get();
            const expiringSoonResult = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM credentials 
        WHERE expires_at IS NOT NULL AND expires_at <= datetime('now', '+7 days') AND expires_at > datetime('now')
      `).get();
            const avgUsageResult = this.db.prepare(`
        SELECT AVG(usage_count) as avg 
        FROM credentials
      `).get();
            const credentialsByType = {
                api_key: 0,
                bearer: 0,
                basic: 0,
                oauth: 0,
            };
            for (const result of typeResults) {
                credentialsByType[result.auth_type] = result.count;
            }
            return {
                totalCredentials: totalResult.count,
                credentialsByType,
                expiredCredentials: expiredResult.count,
                expiringSoonCredentials: expiringSoonResult.count,
                averageUsageCount: Math.round(avgUsageResult.avg || 0),
            };
        }
        catch (error) {
            throw new Error(`Failed to get auth stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Private helper methods
    async ensureMasterKey() {
        const keyPath = this.config.getCredentialKeyPath();
        if (existsSync(keyPath)) {
            // Load existing key
            try {
                const encryptedKey = readFileSync(keyPath, 'utf8');
                this.masterKey = this.decryptMasterKey(encryptedKey);
            }
            catch (error) {
                throw new Error(`Failed to load master key: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            // Generate new key
            this.masterKey = this.generateMasterKey();
            await this.saveMasterKey(this.masterKey);
        }
    }
    generateMasterKey() {
        return randomBytes(32).toString('hex');
    }
    async saveMasterKey(key) {
        const keyPath = this.config.getCredentialKeyPath();
        // Ensure directory exists
        const dir = dirname(keyPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        // Encrypt key with system-specific data
        const encryptedKey = this.encryptMasterKey(key);
        // Save with restrictive permissions
        writeFileSync(keyPath, encryptedKey, { mode: 0o600 });
    }
    encryptMasterKey(key) {
        // Use system-specific data for encryption
        const systemKey = this.getSystemKey();
        return CryptoJS.AES.encrypt(key, systemKey).toString();
    }
    decryptMasterKey(encryptedKey) {
        const systemKey = this.getSystemKey();
        const bytes = CryptoJS.AES.decrypt(encryptedKey, systemKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    getSystemKey() {
        // Generate key based on system characteristics
        const hostname = process.env.HOSTNAME || 'localhost';
        const username = process.env.USER || process.env.USERNAME || 'user';
        const platform = process.platform;
        return CryptoJS.SHA256(`${hostname}:${username}:${platform}:mcp-tool`).toString();
    }
    validateCredentialData(authType, data) {
        switch (authType) {
            case 'api_key':
                return ApiKeyDataSchema.parse(data);
            case 'bearer':
                return BearerTokenDataSchema.parse(data);
            case 'basic':
                return BasicAuthDataSchema.parse(data);
            case 'oauth':
                return OAuthDataSchema.parse(data);
            default:
                throw new Error(`Unsupported auth type: ${authType}`);
        }
    }
    async encryptCredentialData(data) {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }
        const jsonData = JSON.stringify(data);
        const encrypted = this.encryptWithKey(jsonData, this.masterKey);
        return {
            data: Buffer.from(encrypted, 'hex'),
            keyId: 'master',
        };
    }
    async decryptCredentialData(encryptedData, keyId) {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }
        if (keyId !== 'master') {
            throw new Error(`Unsupported key ID: ${keyId}`);
        }
        const encryptedHex = encryptedData.toString('hex');
        const decrypted = this.decryptWithKey(encryptedHex, this.masterKey);
        return JSON.parse(decrypted);
    }
    encryptWithKey(data, key) {
        const salt = randomBytes(16);
        const iv = randomBytes(16);
        const derivedKey = pbkdf2Sync(key, salt, this.config.security.keyDerivationRounds, 32, 'sha256');
        const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(derivedKey.toString('hex')), {
            iv: CryptoJS.enc.Hex.parse(iv.toString('hex')),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        // Combine salt + iv + encrypted data
        const combined = salt.toString('hex') + iv.toString('hex') + cipher.toString();
        return combined;
    }
    decryptWithKey(encryptedData, key) {
        // Extract salt, iv, and encrypted data
        const salt = Buffer.from(encryptedData.slice(0, 32), 'hex');
        const iv = Buffer.from(encryptedData.slice(32, 64), 'hex');
        const encrypted = encryptedData.slice(64);
        // Derive key
        const derivedKey = pbkdf2Sync(key, salt, this.config.security.keyDerivationRounds, 32, 'sha256');
        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Hex.parse(derivedKey.toString('hex')), {
            iv: CryptoJS.enc.Hex.parse(iv.toString('hex')),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    async updateCredentialUsage(credentialId) {
        try {
            const stmt = this.db.prepare(`
        UPDATE credentials 
        SET last_used = ?, usage_count = usage_count + 1
        WHERE id = ?
      `);
            stmt.run(new Date().toISOString(), credentialId);
        }
        catch (error) {
            // Don't throw error for usage tracking failures
            console.warn('Failed to update credential usage:', error);
        }
    }
    async cleanupExpiredCredentials() {
        try {
            const stmt = this.db.prepare(`
        DELETE FROM credentials 
        WHERE expires_at IS NOT NULL AND expires_at <= datetime('now', '-30 days')
      `);
            const result = stmt.run();
            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} expired credentials`);
            }
        }
        catch (error) {
            console.warn('Failed to cleanup expired credentials:', error);
        }
    }
}
