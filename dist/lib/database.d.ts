import { Database } from 'bun:sqlite';
export interface DatabaseConfig {
    path: string;
    enableWAL?: boolean;
    busyTimeout?: number;
    journalMode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
}
export declare class DatabaseManager {
    private db;
    private config;
    constructor(config: DatabaseConfig);
    private configure;
    initialize(): Promise<void>;
    healthCheck(): Promise<boolean>;
    getDatabase(): Database;
    close(): void;
    transaction<T>(fn: () => T): T;
    prepare(query: string): import("bun:sqlite").Statement<unknown, import("bun:sqlite").SQLQueryBindings[] | [null] | [string] | [number] | [bigint] | [false] | [true] | [Uint8Array<ArrayBufferLike>] | [Uint8ClampedArray<ArrayBufferLike>] | [Uint16Array<ArrayBufferLike>] | [Uint32Array<ArrayBufferLike>] | [Int8Array<ArrayBufferLike>] | [Int16Array<ArrayBufferLike>] | [Int32Array<ArrayBufferLike>] | [BigUint64Array<ArrayBufferLike>] | [BigInt64Array<ArrayBufferLike>] | [Float32Array<ArrayBufferLike>] | [Float64Array<ArrayBufferLike>] | [Record<string, string | number | bigint | boolean | NodeJS.TypedArray<ArrayBufferLike> | null>]>;
    getCurrentSchemaVersion(): Promise<string | null>;
    addSchemaVersion(version: string, description: string): Promise<void>;
    backup(backupPath: string): Promise<void>;
    getStats(): Promise<{
        pageCount: number;
        pageSize: number;
        freelist: number;
        schemaVersion: string | null;
        journalMode: string;
        walCheckpoint?: number;
    }>;
}
export declare function getDatabase(config?: DatabaseConfig): DatabaseManager;
export declare function closeDatabase(): void;
export declare function initializeDatabase(config?: DatabaseConfig): Promise<DatabaseManager>;
//# sourceMappingURL=database.d.ts.map