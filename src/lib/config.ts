import { z } from 'zod';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';

// Configuration schemas
const SecurityConfigSchema = z.object({
  encryptionEnabled: z.boolean().default(true),
  keyDerivationRounds: z.number().int().min(50000).default(100000),
  credentialTtl: z.number().int().positive().default(2592000), // 30 days
  masterKeyPath: z.string().optional(),
});

const PerformanceConfigSchema = z.object({
  queryTimeout: z.number().int().positive().default(30),
  maxMemoryUsage: z.number().int().positive().default(536870912), // 512MB
  enableStreaming: z.boolean().default(true),
  maxConcurrentRequests: z.number().int().positive().default(10),
});

const DiscoveryConfigSchema = z.object({
  cacheTimeout: z.number().int().positive().default(3600), // 1 hour
  maxConcurrency: z.number().int().positive().default(5),
  retryAttempts: z.number().int().min(0).default(3),
  retryDelay: z.number().int().positive().default(1000), // 1 second
  defaultTimeout: z.number().int().positive().default(30000), // 30 seconds
});

const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  maxFileSize: z.number().int().positive().default(10485760), // 10MB
  maxFiles: z.number().int().positive().default(5),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(true),
  logDir: z.string().optional(),
});

const DatabaseConfigSchema = z.object({
  path: z.string().optional(),
  enableWAL: z.boolean().default(true),
  busyTimeout: z.number().int().positive().default(30000),
  journalMode: z.enum(['DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'WAL', 'OFF']).default('WAL'),
  backupEnabled: z.boolean().default(true),
  backupInterval: z.number().int().positive().default(86400), // 24 hours
});

// Main configuration schema
const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  security: SecurityConfigSchema,
  performance: PerformanceConfigSchema,
  discovery: DiscoveryConfigSchema,
  logging: LoggingConfigSchema,
  database: DatabaseConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type DiscoveryConfig = z.infer<typeof DiscoveryConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export class ConfigManager {
  private config: Config;
  private configPath: string;
  private dataDir: string;

  constructor(configPath?: string) {
    this.dataDir = this.getDataDirectory();
    this.configPath = configPath ?? join(this.dataDir, 'config.json');
    this.config = this.loadConfig();
  }

  private getDataDirectory(): string {
    // Use environment variable if set, otherwise use OS-specific data directory
    if (process.env.MCP_TOOL_DATA_DIR) {
      return process.env.MCP_TOOL_DATA_DIR;
    }

    const platform = process.platform;
    const home = homedir();

    switch (platform) {
      case 'win32':
        return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'mcp-tool');
      case 'darwin':
        return join(home, 'Library', 'Application Support', 'mcp-tool');
      default:
        return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'mcp-tool');
    }
  }

  private loadConfig(): Config {
    try {
      // Ensure data directory exists
      if (!existsSync(this.dataDir)) {
        mkdirSync(this.dataDir, { recursive: true });
      }

      // Load existing config or create default
      if (existsSync(this.configPath)) {
        const configData = JSON.parse(readFileSync(this.configPath, 'utf-8'));
        return ConfigSchema.parse(configData);
      } else {
        return this.createDefaultConfig();
      }
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
      return this.createDefaultConfig();
    }
  }

  private createDefaultConfig(): Config {
    const defaultConfig: Config = {
      version: '1.0.0',
      security: {
        encryptionEnabled: true,
        keyDerivationRounds: 100000,
        credentialTtl: 2592000, // 30 days
      },
      performance: {
        queryTimeout: 30,
        maxMemoryUsage: 536870912, // 512MB
        enableStreaming: true,
        maxConcurrentRequests: 10,
      },
      discovery: {
        cacheTimeout: 3600, // 1 hour
        maxConcurrency: 5,
        retryAttempts: 3,
        retryDelay: 1000,
        defaultTimeout: 30000,
      },
      logging: {
        level: 'info',
        maxFileSize: 10485760, // 10MB
        maxFiles: 5,
        enableConsole: true,
        enableFile: true,
        logDir: join(this.dataDir, 'logs'),
      },
      database: {
        path: join(this.dataDir, 'mcp-tool.db'),
        enableWAL: true,
        busyTimeout: 30000,
        journalMode: 'WAL',
        backupEnabled: true,
        backupInterval: 86400, // 24 hours
      },
    };

    // Save default config
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  private saveConfig(config: Config): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  // Getters for configuration sections
  get security(): SecurityConfig {
    return this.config.security;
  }

  get performance(): PerformanceConfig {
    return this.config.performance;
  }

  get discovery(): DiscoveryConfig {
    return this.config.discovery;
  }

  get logging(): LoggingConfig {
    return this.config.logging;
  }

  get database(): DatabaseConfig {
    return this.config.database;
  }

  get version(): string {
    return this.config.version;
  }

  get dataDirectory(): string {
    return this.dataDir;
  }

  getConfigPath(): string {
    return this.configPath;
  }

  // Update configuration
  updateSecurity(updates: Partial<SecurityConfig>): void {
    this.config.security = { ...this.config.security, ...updates };
    this.saveConfig(this.config);
  }

  updatePerformance(updates: Partial<PerformanceConfig>): void {
    this.config.performance = { ...this.config.performance, ...updates };
    this.saveConfig(this.config);
  }

  updateDiscovery(updates: Partial<DiscoveryConfig>): void {
    this.config.discovery = { ...this.config.discovery, ...updates };
    this.saveConfig(this.config);
  }

  updateLogging(updates: Partial<LoggingConfig>): void {
    this.config.logging = { ...this.config.logging, ...updates };
    this.saveConfig(this.config);
  }

  updateDatabase(updates: Partial<DatabaseConfig>): void {
    this.config.database = { ...this.config.database, ...updates };
    this.saveConfig(this.config);
  }

  // Validation and migration
  validate(): { valid: boolean; errors: string[] } {
    try {
      ConfigSchema.parse(this.config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return { valid: false, errors: [String(error)] };
    }
  }

  // Environment variable overrides
  applyEnvironmentOverrides(): void {
    const env = process.env;

    // Security overrides
    if (env.MCP_ENCRYPTION_ENABLED !== undefined) {
      this.config.security.encryptionEnabled = env.MCP_ENCRYPTION_ENABLED === 'true';
    }
    if (env.MCP_KEY_DERIVATION_ROUNDS !== undefined) {
      this.config.security.keyDerivationRounds = parseInt(env.MCP_KEY_DERIVATION_ROUNDS, 10);
    }
    if (env.MCP_CREDENTIAL_TTL !== undefined) {
      this.config.security.credentialTtl = parseInt(env.MCP_CREDENTIAL_TTL, 10);
    }

    // Performance overrides
    if (env.MCP_QUERY_TIMEOUT !== undefined) {
      this.config.performance.queryTimeout = parseInt(env.MCP_QUERY_TIMEOUT, 10);
    }
    if (env.MCP_MAX_MEMORY !== undefined) {
      this.config.performance.maxMemoryUsage = parseInt(env.MCP_MAX_MEMORY, 10);
    }

    // Discovery overrides
    if (env.MCP_CACHE_TIMEOUT !== undefined) {
      this.config.discovery.cacheTimeout = parseInt(env.MCP_CACHE_TIMEOUT, 10);
    }
    if (env.MCP_MAX_CONCURRENCY !== undefined) {
      this.config.discovery.maxConcurrency = parseInt(env.MCP_MAX_CONCURRENCY, 10);
    }

    // Logging overrides
    if (env.MCP_LOG_LEVEL !== undefined) {
      this.config.logging.level = env.MCP_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
    if (env.MCP_LOG_DIR !== undefined) {
      this.config.logging.logDir = env.MCP_LOG_DIR;
    }

    // Database overrides
    if (env.MCP_DB_PATH !== undefined) {
      this.config.database.path = env.MCP_DB_PATH;
    }
  }

  // Reset to defaults
  reset(): void {
    this.config = this.createDefaultConfig();
  }

  // Export configuration for debugging
  export(): Config {
    return JSON.parse(JSON.stringify(this.config));
  }

  // Get resolved paths with data directory
  getLogPath(): string {
    return this.config.logging.logDir ?? join(this.dataDir, 'logs');
  }

  getDatabasePath(): string {
    return this.config.database.path ?? join(this.dataDir, 'mcp-tool.db');
  }

  getBackupPath(): string {
    return join(this.dataDir, 'backups');
  }

  getCredentialKeyPath(): string {
    return this.config.security.masterKeyPath ?? join(this.dataDir, '.master.key');
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

export function getConfig(configPath?: string): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager(configPath);
    configManager.applyEnvironmentOverrides();
  }
  return configManager;
}

export function resetConfig(): void {
  configManager = null;
}