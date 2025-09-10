import { z } from 'zod';
import CryptoJS from 'crypto-js';

// Credential authentication types
export const AuthType = z.enum(['api_key', 'bearer', 'basic', 'oauth']);
export type AuthTypeType = z.infer<typeof AuthType>;

// Base credential data schemas
export const ApiKeyCredentialSchema = z.object({
  type: z.literal('api_key'),
  value: z.string().min(1),
  header: z.string().default('Authorization'),
  prefix: z.string().default('Bearer'),
});

export const BearerCredentialSchema = z.object({
  type: z.literal('bearer'),
  value: z.string().min(1),
  header: z.string().default('Authorization'),
});

export const BasicCredentialSchema = z.object({
  type: z.literal('basic'),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const OAuthCredentialSchema = z.object({
  type: z.literal('oauth'),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenType: z.string().default('Bearer'),
  expiresAt: z.string().datetime().optional(),
  scope: z.array(z.string()).optional(),
});

// Union of all credential data types
export const CredentialDataSchema = z.discriminatedUnion('type', [
  ApiKeyCredentialSchema,
  BearerCredentialSchema,
  BasicCredentialSchema,
  OAuthCredentialSchema,
]);

export type CredentialData = z.infer<typeof CredentialDataSchema>;

// Credential schema definition
export const CredentialSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  authType: AuthType,
  encryptedData: z.instanceof(Buffer),
  encryptionKeyId: z.string(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
  usageCount: z.number().int().min(0).default(0),
});

export type Credential = z.infer<typeof CredentialSchema>;

// Credential creation input
export const CredentialCreateSchema = z.object({
  toolId: z.string().uuid(),
  data: CredentialDataSchema,
  expiresAt: z.string().datetime().optional(),
});
export type CredentialCreate = z.infer<typeof CredentialCreateSchema>;

// Credential update input
export const CredentialUpdateSchema = z.object({
  data: CredentialDataSchema.optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CredentialUpdate = z.infer<typeof CredentialUpdateSchema>;

// Decrypted credential (for internal use)
export const DecryptedCredentialSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  type: AuthType,
  data: CredentialDataSchema,
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
  usageCount: z.number().int().min(0),
});
export type DecryptedCredential = z.infer<typeof DecryptedCredentialSchema>;

// Credential list item (sanitized for API responses)
export const CredentialListItemSchema = z.object({
  id: z.string().uuid(),
  toolId: z.string().uuid(),
  authType: AuthType,
  isExpired: z.boolean(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
  usageCount: z.number().int().min(0),
});
export type CredentialListItem = z.infer<typeof CredentialListItemSchema>;

// Credential validation result
export const CredentialValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type CredentialValidationResult = z.infer<typeof CredentialValidationResultSchema>;

// Credential test result
export const CredentialTestResultSchema = z.object({
  valid: z.boolean(),
  statusCode: z.number().optional(),
  responseTime: z.number().optional(),
  error: z.string().optional(),
  testedAt: z.string().datetime(),
});
export type CredentialTestResult = z.infer<typeof CredentialTestResultSchema>;

// Encryption configuration
export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: {
    iterations: number;
    keyLength: number;
    digest: string;
  };
}

// Default encryption configuration
export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'AES',
  keyDerivation: {
    iterations: 100000,
    keyLength: 256 / 8, // 32 bytes for AES-256
    digest: 'SHA256',
  },
};

// Utility functions for credential model
export class CredentialModel {
  private static encryptionConfig: EncryptionConfig = DEFAULT_ENCRYPTION_CONFIG;
  private static masterKey: string | null = null;

  /**
   * Sets the master encryption key
   */
  static setMasterKey(key: string): void {
    this.masterKey = key;
  }

  /**
   * Gets or generates master encryption key
   */
  static getMasterKey(): string {
    if (!this.masterKey) {
      // In production, this should be loaded from secure storage
      this.masterKey = process.env.MCP_MASTER_KEY || this.generateMasterKey();
    }
    return this.masterKey;
  }

  /**
   * Generates a new master key
   */
  private static generateMasterKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Derives encryption key from master key and key ID
   */
  private static deriveKey(keyId: string): string {
    const masterKey = this.getMasterKey();
    const config = this.encryptionConfig.keyDerivation;
    
    return CryptoJS.PBKDF2(masterKey, keyId, {
      keySize: config.keyLength / 4, // CryptoJS uses 32-bit words
      iterations: config.iterations,
      hasher: CryptoJS.algo.SHA256,
    }).toString();
  }

  /**
   * Encrypts credential data
   */
  static encrypt(data: CredentialData, keyId: string): Buffer {
    const derivedKey = this.deriveKey(keyId);
    const dataString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, derivedKey).toString();
    return Buffer.from(encrypted, 'utf8');
  }

  /**
   * Decrypts credential data
   */
  static decrypt(encryptedData: Buffer, keyId: string): CredentialData {
    const derivedKey = this.deriveKey(keyId);
    const encryptedString = encryptedData.toString('utf8');
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedString, derivedKey);
      const dataString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!dataString) {
        throw new Error('Failed to decrypt credential data');
      }
      
      const data = JSON.parse(dataString);
      return CredentialDataSchema.parse(data);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates credential data
   */
  static validateData(data: unknown): CredentialValidationResult {
    try {
      CredentialDataSchema.parse(data);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Creates a new credential with encryption
   */
  static create(credentialData: CredentialCreate): Credential {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const keyId = crypto.randomUUID();
    
    const encryptedData = this.encrypt(credentialData.data, keyId);
    
    return {
      id,
      toolId: credentialData.toolId,
      authType: credentialData.data.type,
      encryptedData,
      encryptionKeyId: keyId,
      expiresAt: credentialData.expiresAt,
      createdAt: now,
      usageCount: 0,
    };
  }

  /**
   * Updates an existing credential
   */
  static update(existingCredential: Credential, updateData: CredentialUpdate): Credential {
    let encryptedData = existingCredential.encryptedData;
    let authType = existingCredential.authType;
    
    // Re-encrypt if data is being updated
    if (updateData.data) {
      encryptedData = this.encrypt(updateData.data, existingCredential.encryptionKeyId);
      authType = updateData.data.type;
    }
    
    return {
      ...existingCredential,
      authType,
      encryptedData,
      expiresAt: updateData.expiresAt ?? existingCredential.expiresAt,
    };
  }

  /**
   * Decrypts a credential for use
   */
  static decryptCredential(credential: Credential): DecryptedCredential {
    const data = this.decrypt(credential.encryptedData, credential.encryptionKeyId);
    
    return {
      id: credential.id,
      toolId: credential.toolId,
      type: credential.authType,
      data,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
      lastUsed: credential.lastUsed,
      usageCount: credential.usageCount,
    };
  }

  /**
   * Checks if a credential is expired
   */
  static isExpired(credential: Credential): boolean {
    if (!credential.expiresAt) {
      return false;
    }
    
    return new Date(credential.expiresAt) <= new Date();
  }

  /**
   * Checks if a credential will expire soon
   */
  static isExpiringSoon(credential: Credential, hoursThreshold: number = 24): boolean {
    if (!credential.expiresAt) {
      return false;
    }
    
    const expiryTime = new Date(credential.expiresAt).getTime();
    const thresholdTime = Date.now() + (hoursThreshold * 60 * 60 * 1000);
    
    return expiryTime <= thresholdTime;
  }

  /**
   * Formats credential for HTTP authorization header
   */
  static formatForAuth(decryptedCredential: DecryptedCredential): Record<string, string> {
    const { data } = decryptedCredential;
    
    switch (data.type) {
      case 'api_key':
        return {
          [data.header]: `${data.prefix} ${data.value}`,
        };
        
      case 'bearer':
        return {
          [data.header]: `Bearer ${data.value}`,
        };
        
      case 'basic':
        const encoded = Buffer.from(`${data.username}:${data.password}`).toString('base64');
        return {
          Authorization: `Basic ${encoded}`,
        };
        
      case 'oauth':
        return {
          Authorization: `${data.tokenType} ${data.accessToken}`,
        };
        
      default:
        throw new Error(`Unsupported credential type: ${(data as any).type}`);
    }
  }

  /**
   * Converts database row to Credential object
   */
  static fromDatabase(row: any): Credential {
    return {
      id: row.id,
      toolId: row.tool_id,
      authType: row.auth_type as AuthTypeType,
      encryptedData: Buffer.isBuffer(row.encrypted_data) 
        ? row.encrypted_data 
        : Buffer.from(row.encrypted_data),
      encryptionKeyId: row.encryption_key_id,
      expiresAt: row.expires_at || undefined,
      createdAt: row.created_at,
      lastUsed: row.last_used || undefined,
      usageCount: row.usage_count,
    };
  }

  /**
   * Converts Credential object to database row format
   */
  static toDatabase(credential: Credential): Record<string, any> {
    return {
      id: credential.id,
      tool_id: credential.toolId,
      auth_type: credential.authType,
      encrypted_data: credential.encryptedData,
      encryption_key_id: credential.encryptionKeyId,
      expires_at: credential.expiresAt || null,
      created_at: credential.createdAt,
      last_used: credential.lastUsed || null,
      usage_count: credential.usageCount,
    };
  }

  /**
   * Converts credential to safe list item (no sensitive data)
   */
  static toListItem(credential: Credential): CredentialListItem {
    return {
      id: credential.id,
      toolId: credential.toolId,
      authType: credential.authType,
      isExpired: this.isExpired(credential),
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
      lastUsed: credential.lastUsed,
      usageCount: credential.usageCount,
    };
  }

  /**
   * Rotates encryption for existing credentials with new master key
   */
  static rotateEncryption(
    credential: Credential, 
    newMasterKey: string
  ): Credential {
    // Decrypt with old key
    const data = this.decrypt(credential.encryptedData, credential.encryptionKeyId);
    
    // Generate new key ID and encrypt with new master key
    const oldMasterKey = this.masterKey;
    this.setMasterKey(newMasterKey);
    
    const newKeyId = crypto.randomUUID();
    const newEncryptedData = this.encrypt(data, newKeyId);
    
    // Restore old master key for other operations
    if (oldMasterKey) {
      this.setMasterKey(oldMasterKey);
    }
    
    return {
      ...credential,
      encryptedData: newEncryptedData,
      encryptionKeyId: newKeyId,
    };
  }
}