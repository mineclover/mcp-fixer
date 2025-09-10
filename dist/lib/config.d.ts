import { z } from 'zod';
declare const SecurityConfigSchema: z.ZodObject<{
    encryptionEnabled: z.ZodDefault<z.ZodBoolean>;
    keyDerivationRounds: z.ZodDefault<z.ZodNumber>;
    credentialTtl: z.ZodDefault<z.ZodNumber>;
    masterKeyPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    encryptionEnabled: boolean;
    keyDerivationRounds: number;
    credentialTtl: number;
    masterKeyPath?: string | undefined;
}, {
    encryptionEnabled?: boolean | undefined;
    keyDerivationRounds?: number | undefined;
    credentialTtl?: number | undefined;
    masterKeyPath?: string | undefined;
}>;
declare const PerformanceConfigSchema: z.ZodObject<{
    queryTimeout: z.ZodDefault<z.ZodNumber>;
    maxMemoryUsage: z.ZodDefault<z.ZodNumber>;
    enableStreaming: z.ZodDefault<z.ZodBoolean>;
    maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    queryTimeout: number;
    maxMemoryUsage: number;
    enableStreaming: boolean;
    maxConcurrentRequests: number;
}, {
    queryTimeout?: number | undefined;
    maxMemoryUsage?: number | undefined;
    enableStreaming?: boolean | undefined;
    maxConcurrentRequests?: number | undefined;
}>;
declare const DiscoveryConfigSchema: z.ZodObject<{
    cacheTimeout: z.ZodDefault<z.ZodNumber>;
    maxConcurrency: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    defaultTimeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cacheTimeout: number;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    defaultTimeout: number;
}, {
    cacheTimeout?: number | undefined;
    maxConcurrency?: number | undefined;
    retryAttempts?: number | undefined;
    retryDelay?: number | undefined;
    defaultTimeout?: number | undefined;
}>;
declare const LoggingConfigSchema: z.ZodObject<{
    level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    maxFileSize: z.ZodDefault<z.ZodNumber>;
    maxFiles: z.ZodDefault<z.ZodNumber>;
    enableConsole: z.ZodDefault<z.ZodBoolean>;
    enableFile: z.ZodDefault<z.ZodBoolean>;
    logDir: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    level: "debug" | "info" | "warn" | "error";
    maxFileSize: number;
    maxFiles: number;
    enableConsole: boolean;
    enableFile: boolean;
    logDir?: string | undefined;
}, {
    level?: "debug" | "info" | "warn" | "error" | undefined;
    maxFileSize?: number | undefined;
    maxFiles?: number | undefined;
    enableConsole?: boolean | undefined;
    enableFile?: boolean | undefined;
    logDir?: string | undefined;
}>;
declare const DatabaseConfigSchema: z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
    enableWAL: z.ZodDefault<z.ZodBoolean>;
    busyTimeout: z.ZodDefault<z.ZodNumber>;
    journalMode: z.ZodDefault<z.ZodEnum<["DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"]>>;
    backupEnabled: z.ZodDefault<z.ZodBoolean>;
    backupInterval: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enableWAL: boolean;
    busyTimeout: number;
    journalMode: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF";
    backupEnabled: boolean;
    backupInterval: number;
    path?: string | undefined;
}, {
    path?: string | undefined;
    enableWAL?: boolean | undefined;
    busyTimeout?: number | undefined;
    journalMode?: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF" | undefined;
    backupEnabled?: boolean | undefined;
    backupInterval?: number | undefined;
}>;
declare const ConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    security: z.ZodObject<{
        encryptionEnabled: z.ZodDefault<z.ZodBoolean>;
        keyDerivationRounds: z.ZodDefault<z.ZodNumber>;
        credentialTtl: z.ZodDefault<z.ZodNumber>;
        masterKeyPath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        encryptionEnabled: boolean;
        keyDerivationRounds: number;
        credentialTtl: number;
        masterKeyPath?: string | undefined;
    }, {
        encryptionEnabled?: boolean | undefined;
        keyDerivationRounds?: number | undefined;
        credentialTtl?: number | undefined;
        masterKeyPath?: string | undefined;
    }>;
    performance: z.ZodObject<{
        queryTimeout: z.ZodDefault<z.ZodNumber>;
        maxMemoryUsage: z.ZodDefault<z.ZodNumber>;
        enableStreaming: z.ZodDefault<z.ZodBoolean>;
        maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        queryTimeout: number;
        maxMemoryUsage: number;
        enableStreaming: boolean;
        maxConcurrentRequests: number;
    }, {
        queryTimeout?: number | undefined;
        maxMemoryUsage?: number | undefined;
        enableStreaming?: boolean | undefined;
        maxConcurrentRequests?: number | undefined;
    }>;
    discovery: z.ZodObject<{
        cacheTimeout: z.ZodDefault<z.ZodNumber>;
        maxConcurrency: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
        retryDelay: z.ZodDefault<z.ZodNumber>;
        defaultTimeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cacheTimeout: number;
        maxConcurrency: number;
        retryAttempts: number;
        retryDelay: number;
        defaultTimeout: number;
    }, {
        cacheTimeout?: number | undefined;
        maxConcurrency?: number | undefined;
        retryAttempts?: number | undefined;
        retryDelay?: number | undefined;
        defaultTimeout?: number | undefined;
    }>;
    logging: z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        maxFileSize: z.ZodDefault<z.ZodNumber>;
        maxFiles: z.ZodDefault<z.ZodNumber>;
        enableConsole: z.ZodDefault<z.ZodBoolean>;
        enableFile: z.ZodDefault<z.ZodBoolean>;
        logDir: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level: "debug" | "info" | "warn" | "error";
        maxFileSize: number;
        maxFiles: number;
        enableConsole: boolean;
        enableFile: boolean;
        logDir?: string | undefined;
    }, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        maxFileSize?: number | undefined;
        maxFiles?: number | undefined;
        enableConsole?: boolean | undefined;
        enableFile?: boolean | undefined;
        logDir?: string | undefined;
    }>;
    database: z.ZodObject<{
        path: z.ZodOptional<z.ZodString>;
        enableWAL: z.ZodDefault<z.ZodBoolean>;
        busyTimeout: z.ZodDefault<z.ZodNumber>;
        journalMode: z.ZodDefault<z.ZodEnum<["DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"]>>;
        backupEnabled: z.ZodDefault<z.ZodBoolean>;
        backupInterval: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enableWAL: boolean;
        busyTimeout: number;
        journalMode: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF";
        backupEnabled: boolean;
        backupInterval: number;
        path?: string | undefined;
    }, {
        path?: string | undefined;
        enableWAL?: boolean | undefined;
        busyTimeout?: number | undefined;
        journalMode?: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF" | undefined;
        backupEnabled?: boolean | undefined;
        backupInterval?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    version: string;
    security: {
        encryptionEnabled: boolean;
        keyDerivationRounds: number;
        credentialTtl: number;
        masterKeyPath?: string | undefined;
    };
    performance: {
        queryTimeout: number;
        maxMemoryUsage: number;
        enableStreaming: boolean;
        maxConcurrentRequests: number;
    };
    discovery: {
        cacheTimeout: number;
        maxConcurrency: number;
        retryAttempts: number;
        retryDelay: number;
        defaultTimeout: number;
    };
    logging: {
        level: "debug" | "info" | "warn" | "error";
        maxFileSize: number;
        maxFiles: number;
        enableConsole: boolean;
        enableFile: boolean;
        logDir?: string | undefined;
    };
    database: {
        enableWAL: boolean;
        busyTimeout: number;
        journalMode: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF";
        backupEnabled: boolean;
        backupInterval: number;
        path?: string | undefined;
    };
}, {
    security: {
        encryptionEnabled?: boolean | undefined;
        keyDerivationRounds?: number | undefined;
        credentialTtl?: number | undefined;
        masterKeyPath?: string | undefined;
    };
    performance: {
        queryTimeout?: number | undefined;
        maxMemoryUsage?: number | undefined;
        enableStreaming?: boolean | undefined;
        maxConcurrentRequests?: number | undefined;
    };
    discovery: {
        cacheTimeout?: number | undefined;
        maxConcurrency?: number | undefined;
        retryAttempts?: number | undefined;
        retryDelay?: number | undefined;
        defaultTimeout?: number | undefined;
    };
    logging: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        maxFileSize?: number | undefined;
        maxFiles?: number | undefined;
        enableConsole?: boolean | undefined;
        enableFile?: boolean | undefined;
        logDir?: string | undefined;
    };
    database: {
        path?: string | undefined;
        enableWAL?: boolean | undefined;
        busyTimeout?: number | undefined;
        journalMode?: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF" | undefined;
        backupEnabled?: boolean | undefined;
        backupInterval?: number | undefined;
    };
    version?: string | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type DiscoveryConfig = z.infer<typeof DiscoveryConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export declare class ConfigManager {
    private config;
    private configPath;
    private dataDir;
    constructor(configPath?: string);
    private getDataDirectory;
    private loadConfig;
    private createDefaultConfig;
    private saveConfig;
    get security(): SecurityConfig;
    get performance(): PerformanceConfig;
    get discovery(): DiscoveryConfig;
    get logging(): LoggingConfig;
    get database(): DatabaseConfig;
    get version(): string;
    get dataDirectory(): string;
    getConfigPath(): string;
    updateSecurity(updates: Partial<SecurityConfig>): void;
    updatePerformance(updates: Partial<PerformanceConfig>): void;
    updateDiscovery(updates: Partial<DiscoveryConfig>): void;
    updateLogging(updates: Partial<LoggingConfig>): void;
    updateDatabase(updates: Partial<DatabaseConfig>): void;
    validate(): {
        valid: boolean;
        errors: string[];
    };
    applyEnvironmentOverrides(): void;
    reset(): void;
    export(): Config;
    getLogPath(): string;
    getDatabasePath(): string;
    getBackupPath(): string;
    getCredentialKeyPath(): string;
}
export declare function getConfig(configPath?: string): ConfigManager;
export declare function resetConfig(): void;
export {};
//# sourceMappingURL=config.d.ts.map