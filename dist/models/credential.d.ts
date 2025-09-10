import { z } from 'zod';
export declare const AuthType: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
export type AuthTypeType = z.infer<typeof AuthType>;
export declare const ApiKeyCredentialSchema: z.ZodObject<{
    type: z.ZodLiteral<"api_key">;
    value: z.ZodString;
    header: z.ZodDefault<z.ZodString>;
    prefix: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "api_key";
    header: string;
    prefix: string;
}, {
    value: string;
    type: "api_key";
    header?: string | undefined;
    prefix?: string | undefined;
}>;
export declare const BearerCredentialSchema: z.ZodObject<{
    type: z.ZodLiteral<"bearer">;
    value: z.ZodString;
    header: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "bearer";
    header: string;
}, {
    value: string;
    type: "bearer";
    header?: string | undefined;
}>;
export declare const BasicCredentialSchema: z.ZodObject<{
    type: z.ZodLiteral<"basic">;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "basic";
    username: string;
    password: string;
}, {
    type: "basic";
    username: string;
    password: string;
}>;
export declare const OAuthCredentialSchema: z.ZodObject<{
    type: z.ZodLiteral<"oauth">;
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenType: z.ZodDefault<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "oauth";
    accessToken: string;
    tokenType: string;
    refreshToken?: string | undefined;
    expiresAt?: string | undefined;
    scope?: string[] | undefined;
}, {
    type: "oauth";
    accessToken: string;
    refreshToken?: string | undefined;
    tokenType?: string | undefined;
    expiresAt?: string | undefined;
    scope?: string[] | undefined;
}>;
export declare const CredentialDataSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"api_key">;
    value: z.ZodString;
    header: z.ZodDefault<z.ZodString>;
    prefix: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "api_key";
    header: string;
    prefix: string;
}, {
    value: string;
    type: "api_key";
    header?: string | undefined;
    prefix?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"bearer">;
    value: z.ZodString;
    header: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "bearer";
    header: string;
}, {
    value: string;
    type: "bearer";
    header?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"basic">;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "basic";
    username: string;
    password: string;
}, {
    type: "basic";
    username: string;
    password: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"oauth">;
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenType: z.ZodDefault<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "oauth";
    accessToken: string;
    tokenType: string;
    refreshToken?: string | undefined;
    expiresAt?: string | undefined;
    scope?: string[] | undefined;
}, {
    type: "oauth";
    accessToken: string;
    refreshToken?: string | undefined;
    tokenType?: string | undefined;
    expiresAt?: string | undefined;
    scope?: string[] | undefined;
}>]>;
export type CredentialData = z.infer<typeof CredentialDataSchema>;
export declare const CredentialSchema: z.ZodObject<{
    id: z.ZodString;
    toolId: z.ZodString;
    authType: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
    encryptedData: z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>;
    encryptionKeyId: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    lastUsed: z.ZodOptional<z.ZodString>;
    usageCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    toolId: string;
    authType: "api_key" | "bearer" | "basic" | "oauth";
    encryptedData: Buffer<ArrayBufferLike>;
    encryptionKeyId: string;
    createdAt: string;
    usageCount: number;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
}, {
    id: string;
    toolId: string;
    authType: "api_key" | "bearer" | "basic" | "oauth";
    encryptedData: Buffer<ArrayBufferLike>;
    encryptionKeyId: string;
    createdAt: string;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
    usageCount?: number | undefined;
}>;
export type Credential = z.infer<typeof CredentialSchema>;
export declare const CredentialCreateSchema: z.ZodObject<{
    toolId: z.ZodString;
    data: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"api_key">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
        prefix: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    }, {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"bearer">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "bearer";
        header: string;
    }, {
        value: string;
        type: "bearer";
        header?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"basic">;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "basic";
        username: string;
        password: string;
    }, {
        type: "basic";
        username: string;
        password: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"oauth">;
        accessToken: z.ZodString;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenType: z.ZodDefault<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }, {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }>]>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data: {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    } | {
        value: string;
        type: "bearer";
        header: string;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    };
    toolId: string;
    expiresAt?: string | undefined;
}, {
    data: {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    } | {
        value: string;
        type: "bearer";
        header?: string | undefined;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    };
    toolId: string;
    expiresAt?: string | undefined;
}>;
export type CredentialCreate = z.infer<typeof CredentialCreateSchema>;
export declare const CredentialUpdateSchema: z.ZodObject<{
    data: z.ZodOptional<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"api_key">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
        prefix: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    }, {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"bearer">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "bearer";
        header: string;
    }, {
        value: string;
        type: "bearer";
        header?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"basic">;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "basic";
        username: string;
        password: string;
    }, {
        type: "basic";
        username: string;
        password: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"oauth">;
        accessToken: z.ZodString;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenType: z.ZodDefault<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }, {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }>]>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data?: {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    } | {
        value: string;
        type: "bearer";
        header: string;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    } | undefined;
    expiresAt?: string | undefined;
}, {
    data?: {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    } | {
        value: string;
        type: "bearer";
        header?: string | undefined;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    } | undefined;
    expiresAt?: string | undefined;
}>;
export type CredentialUpdate = z.infer<typeof CredentialUpdateSchema>;
export declare const DecryptedCredentialSchema: z.ZodObject<{
    id: z.ZodString;
    toolId: z.ZodString;
    type: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
    data: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"api_key">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
        prefix: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    }, {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"bearer">;
        value: z.ZodString;
        header: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "bearer";
        header: string;
    }, {
        value: string;
        type: "bearer";
        header?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"basic">;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "basic";
        username: string;
        password: string;
    }, {
        type: "basic";
        username: string;
        password: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"oauth">;
        accessToken: z.ZodString;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenType: z.ZodDefault<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }, {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    }>]>;
    expiresAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    lastUsed: z.ZodOptional<z.ZodString>;
    usageCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "api_key" | "bearer" | "basic" | "oauth";
    data: {
        value: string;
        type: "api_key";
        header: string;
        prefix: string;
    } | {
        value: string;
        type: "bearer";
        header: string;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        tokenType: string;
        refreshToken?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    };
    id: string;
    toolId: string;
    createdAt: string;
    usageCount: number;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
}, {
    type: "api_key" | "bearer" | "basic" | "oauth";
    data: {
        value: string;
        type: "api_key";
        header?: string | undefined;
        prefix?: string | undefined;
    } | {
        value: string;
        type: "bearer";
        header?: string | undefined;
    } | {
        type: "basic";
        username: string;
        password: string;
    } | {
        type: "oauth";
        accessToken: string;
        refreshToken?: string | undefined;
        tokenType?: string | undefined;
        expiresAt?: string | undefined;
        scope?: string[] | undefined;
    };
    id: string;
    toolId: string;
    createdAt: string;
    usageCount: number;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
}>;
export type DecryptedCredential = z.infer<typeof DecryptedCredentialSchema>;
export declare const CredentialListItemSchema: z.ZodObject<{
    id: z.ZodString;
    toolId: z.ZodString;
    authType: z.ZodEnum<["api_key", "bearer", "basic", "oauth"]>;
    isExpired: z.ZodBoolean;
    expiresAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    lastUsed: z.ZodOptional<z.ZodString>;
    usageCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    toolId: string;
    authType: "api_key" | "bearer" | "basic" | "oauth";
    createdAt: string;
    usageCount: number;
    isExpired: boolean;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
}, {
    id: string;
    toolId: string;
    authType: "api_key" | "bearer" | "basic" | "oauth";
    createdAt: string;
    usageCount: number;
    isExpired: boolean;
    expiresAt?: string | undefined;
    lastUsed?: string | undefined;
}>;
export type CredentialListItem = z.infer<typeof CredentialListItemSchema>;
export declare const CredentialValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: string[];
    warnings: string[];
}, {
    valid: boolean;
    errors: string[];
    warnings?: string[] | undefined;
}>;
export type CredentialValidationResult = z.infer<typeof CredentialValidationResultSchema>;
export declare const CredentialTestResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    statusCode: z.ZodOptional<z.ZodNumber>;
    responseTime: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    testedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    testedAt: string;
    error?: string | undefined;
    statusCode?: number | undefined;
    responseTime?: number | undefined;
}, {
    valid: boolean;
    testedAt: string;
    error?: string | undefined;
    statusCode?: number | undefined;
    responseTime?: number | undefined;
}>;
export type CredentialTestResult = z.infer<typeof CredentialTestResultSchema>;
export interface EncryptionConfig {
    algorithm: string;
    keyDerivation: {
        iterations: number;
        keyLength: number;
        digest: string;
    };
}
export declare const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig;
export declare class CredentialModel {
    private static encryptionConfig;
    private static masterKey;
    /**
     * Sets the master encryption key
     */
    static setMasterKey(key: string): void;
    /**
     * Gets or generates master encryption key
     */
    static getMasterKey(): string;
    /**
     * Generates a new master key
     */
    private static generateMasterKey;
    /**
     * Derives encryption key from master key and key ID
     */
    private static deriveKey;
    /**
     * Encrypts credential data
     */
    static encrypt(data: CredentialData, keyId: string): Buffer;
    /**
     * Validates credential data
     */
    static validateData(data: unknown): CredentialValidationResult;
    /**
     * Creates a new credential with encryption
     */
    static create(credentialData: CredentialCreate): Credential;
    /**
     * Updates an existing credential
     */
    static update(existingCredential: Credential, updateData: CredentialUpdate): Credential;
    /**
     * Checks if a credential is expired
     */
    static isExpired(credential: Credential): boolean;
    /**
     * Checks if a credential will expire soon
     */
    static isExpiringSoon(credential: Credential, hoursThreshold?: number): boolean;
    /**
     * Formats credential for HTTP authorization header
     */
    static formatForAuth(decryptedCredential: DecryptedCredential): Record<string, string>;
    /**
     * Converts database row to Credential object
     */
    static fromDatabase(row: any): Credential;
    /**
     * Converts Credential object to database row format
     */
    static toDatabase(credential: Credential): Record<string, any>;
    /**
     * Converts credential to safe list item (no sensitive data)
     */
    static toListItem(credential: Credential): CredentialListItem;
    /**
     * Rotates encryption for existing credentials with new master key
     */
    static rotateEncryption(credential: Credential, newMasterKey: string): Credential;
}
//# sourceMappingURL=credential.d.ts.map