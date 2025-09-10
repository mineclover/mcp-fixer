import { Database } from 'bun:sqlite';
import { join } from 'path';
import { ALL_SCHEMA_STATEMENTS } from './schema';

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  busyTimeout?: number;
  journalMode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
}

export class DatabaseManager {
  private db: Database;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = {
      enableWAL: true,
      busyTimeout: 30000,
      journalMode: 'WAL',
      ...config,
    };

    this.db = new Database(this.config.path);
    this.configure();
  }

  private configure(): void {
    // Enable foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON');
    
    // Set journal mode
    this.db.exec(`PRAGMA journal_mode = ${this.config.journalMode}`);
    
    // Set busy timeout
    this.db.exec(`PRAGMA busy_timeout = ${this.config.busyTimeout}`);
    
    // Optimize for performance
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA cache_size = 10000');
    this.db.exec('PRAGMA temp_store = MEMORY');
    this.db.exec('PRAGMA mmap_size = 268435456'); // 256MB
  }

  async initialize(): Promise<void> {
    try {
      // Check if database is already initialized
      const isInitialized = await this.isInitialized();
      if (isInitialized) {
        console.log('Database already initialized');
        return;
      }

      // Execute schema statements using the predefined schema
      this.db.transaction(() => {
        for (const statement of ALL_SCHEMA_STATEMENTS) {
          const trimmed = statement.trim();
          if (trimmed) {
            try {
              this.db.exec(trimmed);
            } catch (error) {
              console.error(`Failed to execute SQL statement: ${trimmed.substring(0, 100)}...`);
              throw error;
            }
          }
        }
      })();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async isInitialized(): Promise<boolean> {
    try {
      const result = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'").get();
      return !!result;
    } catch {
      return false;
    }
  }


  async healthCheck(): Promise<boolean> {
    try {
      // Check database integrity
      const integrityResult = this.db.query('PRAGMA integrity_check').get() as { integrity_check: string };
      if (integrityResult.integrity_check !== 'ok') {
        console.error('Database integrity check failed:', integrityResult.integrity_check);
        return false;
      }

      // Check foreign key consistency
      const fkResult = this.db.query('PRAGMA foreign_key_check').all();
      if (fkResult.length > 0) {
        console.error('Foreign key violations found:', fkResult);
        return false;
      }

      // Check if schema version exists
      const versionResult = this.db.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1').get() as { version: string } | null;
      if (!versionResult) {
        console.error('Schema version not found');
        return false;
      }

      console.log(`Database healthy, schema version: ${versionResult.version}`);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  getDatabase(): Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  // Transaction helper
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  // Prepared statement helpers
  prepare(query: string) {
    return this.db.prepare(query);
  }

  // Migration helpers
  async getCurrentSchemaVersion(): Promise<string | null> {
    try {
      const result = this.db.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1').get() as { version: string } | null;
      return result?.version ?? null;
    } catch {
      return null;
    }
  }

  async addSchemaVersion(version: string, description: string): Promise<void> {
    const stmt = this.db.prepare('INSERT INTO schema_version (version, description) VALUES (?, ?)');
    stmt.run(version, description);
  }

  // Backup utilities
  async backup(backupPath: string): Promise<void> {
    try {
      this.db.exec(`VACUUM INTO '${backupPath}'`);
      console.log(`Database backed up to: ${backupPath}`);
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(): Promise<{
    pageCount: number;
    pageSize: number;
    freelist: number;
    schemaVersion: string | null;
    journalMode: string;
    walCheckpoint?: number;
  }> {
    const pageCount = (this.db.query('PRAGMA page_count').get() as { page_count: number }).page_count;
    const pageSize = (this.db.query('PRAGMA page_size').get() as { page_size: number }).page_size;
    const freelist = (this.db.query('PRAGMA freelist_count').get() as { freelist_count: number }).freelist_count;
    const journalMode = (this.db.query('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode;
    const schemaVersion = await this.getCurrentSchemaVersion();
    
    const stats = {
      pageCount,
      pageSize,
      freelist,
      schemaVersion,
      journalMode,
    };

    // Add WAL checkpoint info if in WAL mode
    if (journalMode === 'wal') {
      try {
        const walResult = this.db.query('PRAGMA wal_checkpoint(PASSIVE)').get() as { wal_checkpoint: number };
        return { ...stats, walCheckpoint: walResult.wal_checkpoint };
      } catch {
        // WAL checkpoint failed, continue without it
      }
    }

    return stats;
  }
}

// Singleton instance for application use
let dbInstance: DatabaseManager | null = null;

export function getDatabase(config?: DatabaseConfig): DatabaseManager {
  if (!dbInstance) {
    const defaultConfig: DatabaseConfig = {
      path: process.env.DB_PATH ?? join(process.cwd(), 'data', 'mcp-tool.db'),
      enableWAL: true,
      busyTimeout: 30000,
      journalMode: 'WAL',
    };
    
    dbInstance = new DatabaseManager(config ?? defaultConfig);
  }
  
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Initialize database for CLI usage
export async function initializeDatabase(config?: DatabaseConfig): Promise<DatabaseManager> {
  const db = getDatabase(config);
  await db.initialize();
  
  // Run health check
  const healthy = await db.healthCheck();
  if (!healthy) {
    throw new Error('Database health check failed after initialization');
  }
  
  return db;
}