import { Database } from 'bun:sqlite';
import { join } from 'path';
import { ALL_SCHEMA_STATEMENTS } from './schema';
export class DatabaseManager {
    db;
    config;
    constructor(config) {
        this.config = {
            enableWAL: true,
            busyTimeout: 30000,
            journalMode: 'WAL',
            ...config,
        };
        this.db = new Database(this.config.path);
        this.configure();
    }
    configure() {
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
    async initialize() {
        try {
            // Execute schema statements using the predefined schema
            this.db.transaction(() => {
                for (const statement of ALL_SCHEMA_STATEMENTS) {
                    const trimmed = statement.trim();
                    if (trimmed) {
                        try {
                            this.db.exec(trimmed);
                        }
                        catch (error) {
                            console.error(`Failed to execute SQL statement: ${trimmed.substring(0, 100)}...`);
                            throw error;
                        }
                    }
                }
            })();
            console.log('Database initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Check database integrity
            const integrityResult = this.db.query('PRAGMA integrity_check').get();
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
            const versionResult = this.db.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1').get();
            if (!versionResult) {
                console.error('Schema version not found');
                return false;
            }
            console.log(`Database healthy, schema version: ${versionResult.version}`);
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    getDatabase() {
        return this.db;
    }
    close() {
        this.db.close();
    }
    // Transaction helper
    transaction(fn) {
        return this.db.transaction(fn)();
    }
    // Prepared statement helpers
    prepare(query) {
        return this.db.prepare(query);
    }
    // Migration helpers
    async getCurrentSchemaVersion() {
        try {
            const result = this.db.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1').get();
            return result?.version ?? null;
        }
        catch {
            return null;
        }
    }
    async addSchemaVersion(version, description) {
        const stmt = this.db.prepare('INSERT INTO schema_version (version, description) VALUES (?, ?)');
        stmt.run(version, description);
    }
    // Backup utilities
    async backup(backupPath) {
        try {
            this.db.exec(`VACUUM INTO '${backupPath}'`);
            console.log(`Database backed up to: ${backupPath}`);
        }
        catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }
    // Statistics
    async getStats() {
        const pageCount = this.db.query('PRAGMA page_count').get().page_count;
        const pageSize = this.db.query('PRAGMA page_size').get().page_size;
        const freelist = this.db.query('PRAGMA freelist_count').get().freelist_count;
        const journalMode = this.db.query('PRAGMA journal_mode').get().journal_mode;
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
                const walResult = this.db.query('PRAGMA wal_checkpoint(PASSIVE)').get();
                return { ...stats, walCheckpoint: walResult.wal_checkpoint };
            }
            catch {
                // WAL checkpoint failed, continue without it
            }
        }
        return stats;
    }
}
// Singleton instance for application use
let dbInstance = null;
export function getDatabase(config) {
    if (!dbInstance) {
        const defaultConfig = {
            path: process.env.DB_PATH ?? join(process.cwd(), 'data', 'mcp-tool.db'),
            enableWAL: true,
            busyTimeout: 30000,
            journalMode: 'WAL',
        };
        dbInstance = new DatabaseManager(config ?? defaultConfig);
    }
    return dbInstance;
}
export function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
// Initialize database for CLI usage
export async function initializeDatabase(config) {
    const db = getDatabase(config);
    await db.initialize();
    // Run health check
    const healthy = await db.healthCheck();
    if (!healthy) {
        throw new Error('Database health check failed after initialization');
    }
    return db;
}
