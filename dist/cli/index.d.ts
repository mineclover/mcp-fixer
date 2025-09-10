#!/usr/bin/env node
import { ConfigManager } from '../lib/config.js';
import { DatabaseManager } from '../lib/database.js';
import { AuthManager } from '../services/auth/auth-manager.js';
import { ToolDiscoveryService } from '../services/discovery/tool-discovery.js';
import { QueryEngine } from '../services/query/query-engine.js';
import { CollectorManager } from '../services/collector/collector-manager.js';
import { MCPClient } from '../services/discovery/mcp-client.js';
export interface GlobalOptions {
    config?: string;
    database?: string;
    format: 'json' | 'table' | 'csv';
    verbose: boolean;
    quiet: boolean;
}
export interface CLIServices {
    config: ConfigManager;
    db: DatabaseManager;
    authManager: AuthManager;
    discoveryService: ToolDiscoveryService;
    queryEngine: QueryEngine;
    collectorManager: CollectorManager;
    mcpClient: MCPClient;
}
export declare class OutputFormatter {
    private format;
    private quiet;
    constructor(format: GlobalOptions['format'], quiet: boolean);
    success(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    verbose(message: string): void;
    output(data: any): void;
    private outputTable;
    private outputCSV;
}
export declare function handleError(error: Error, options: GlobalOptions): void;
export type { CLIServices, GlobalOptions };
//# sourceMappingURL=index.d.ts.map