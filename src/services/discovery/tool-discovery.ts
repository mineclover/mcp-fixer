import { z } from 'zod';
import fetch from 'node-fetch';
import { Tool, ToolCreate, ToolModel, ToolDiscoveryResult } from '../../models/tool.js';
import { DatabaseManager } from '../../lib/database.js';
import { ConfigManager } from '../../lib/config.js';

// Discovery configuration schema
const DiscoveryOptionsSchema = z.object({
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().min(0).default(3),
  retryDelay: z.number().positive().default(1000),
  maxConcurrency: z.number().positive().default(5),
  cacheTimeout: z.number().positive().default(3600),
  userAgent: z.string().default('mcp-tool/1.0.0'),
});

export type DiscoveryOptions = z.infer<typeof DiscoveryOptionsSchema>;

// Discovery endpoint configuration
const EndpointConfigSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  method: z.enum(['GET', 'POST']).default('GET'),
  body: z.string().optional(),
});

export type EndpointConfig = z.infer<typeof EndpointConfigSchema>;

// Discovery cache entry
interface CacheEntry {
  result: ToolDiscoveryResult;
  timestamp: number;
  expiresAt: number;
}

export class ToolDiscoveryService {
  private db: DatabaseManager;
  private config: ConfigManager;
  private cache: Map<string, CacheEntry> = new Map();
  private activeDiscoveries: Map<string, Promise<ToolDiscoveryResult>> = new Map();

  constructor(db: DatabaseManager, config: ConfigManager) {
    this.db = db;
    this.config = config;
  }

  /**
   * Discover tools from a specific endpoint
   */
  async discoverFromEndpoint(
    endpoint: string,
    options: Partial<DiscoveryOptions> = {}
  ): Promise<ToolDiscoveryResult> {
    const opts = DiscoveryOptionsSchema.parse({
      ...this.config.discovery,
      ...options,
    });

    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, opts);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Check if discovery is already in progress
    const activeDiscovery = this.activeDiscoveries.get(cacheKey);
    if (activeDiscovery) {
      return activeDiscovery;
    }

    // Start new discovery
    const discoveryPromise = this.performDiscovery(endpoint, opts);
    this.activeDiscoveries.set(cacheKey, discoveryPromise);

    try {
      const result = await discoveryPromise;
      
      // Cache successful results
      if (result.status === 'success') {
        this.setCache(cacheKey, result, opts.cacheTimeout);
      }
      
      return result;
    } finally {
      this.activeDiscoveries.delete(cacheKey);
    }
  }

  /**
   * Discover tools from multiple endpoints concurrently
   */
  async discoverFromEndpoints(
    endpoints: string[],
    options: Partial<DiscoveryOptions> = {}
  ): Promise<ToolDiscoveryResult[]> {
    const opts = DiscoveryOptionsSchema.parse({
      ...this.config.discovery,
      ...options,
    });

    // Process endpoints in batches to respect concurrency limits
    const results: ToolDiscoveryResult[] = [];
    const batches = this.chunkArray(endpoints, opts.maxConcurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(endpoint => 
        this.discoverFromEndpoint(endpoint, opts).catch(error => ({
          tools: [],
          endpoint,
          status: 'error' as const,
          error: error.message,
          responseTime: undefined,
          cached: false,
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Auto-discover local MCP tools
   */
  async autoDiscoverLocal(): Promise<ToolDiscoveryResult> {
    const startTime = Date.now();
    
    try {
      // Look for common local MCP server patterns
      const localEndpoints = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8000',
      ];

      // Also check environment variables for MCP endpoints
      const envEndpoints = this.getEnvironmentEndpoints();
      localEndpoints.push(...envEndpoints);

      const results = await this.discoverFromEndpoints(localEndpoints, {
        timeout: 5000, // Shorter timeout for local discovery
        retryAttempts: 1,
      });

      // Aggregate results
      const tools: ToolCreate[] = [];
      const errors: string[] = [];

      for (const result of results) {
        if (result.status === 'success') {
          tools.push(...result.tools);
        } else if (result.error) {
          errors.push(`${result.endpoint}: ${result.error}`);
        }
      }

      return {
        tools,
        endpoint: 'auto-discovery',
        status: tools.length > 0 ? 'success' : 'error',
        error: errors.length > 0 ? errors.join('; ') : undefined,
        responseTime: Date.now() - startTime,
        cached: false,
      };

    } catch (error) {
      return {
        tools: [],
        endpoint: 'auto-discovery',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime,
        cached: false,
      };
    }
  }

  /**
   * Save discovered tools to database
   */
  async saveTools(tools: ToolCreate[]): Promise<{ saved: Tool[]; skipped: number; errors: string[] }> {
    const saved: Tool[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (const toolData of tools) {
      try {
        // Validate tool data
        const validation = ToolModel.validateCreate(toolData);
        if (!validation.valid) {
          errors.push(`Tool ${toolData.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Check if tool already exists (by name + endpoint)
        const existing = this.db.prepare(
          'SELECT id FROM tools WHERE name = ? AND endpoint = ?'
        ).get(toolData.name, toolData.endpoint);

        if (existing) {
          // Update existing tool
          const updatedTool = await this.updateExistingTool(existing.id as string, toolData);
          if (updatedTool) {
            saved.push(updatedTool);
          } else {
            skipped++;
          }
        } else {
          // Create new tool
          const newTool = ToolModel.create(toolData);
          const dbData = ToolModel.toDatabase(newTool);
          
          const stmt = this.db.prepare(`
            INSERT INTO tools (
              id, name, version, description, endpoint, capabilities, 
              auth_config, schema, discovery_data, status, 
              last_checked, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            dbData.id, dbData.name, dbData.version, dbData.description,
            dbData.endpoint, dbData.capabilities, dbData.auth_config,
            dbData.schema, dbData.discovery_data, dbData.status,
            dbData.last_checked, dbData.created_at, dbData.updated_at
          );

          saved.push(newTool);
        }
      } catch (error) {
        errors.push(`Tool ${toolData.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { saved, skipped, errors };
  }

  /**
   * Refresh capabilities for existing tools
   */
  async refreshToolCapabilities(toolIds?: string[]): Promise<{ refreshed: Tool[]; errors: string[] }> {
    const refreshed: Tool[] = [];
    const errors: string[] = [];

    try {
      // Get tools to refresh
      let query = 'SELECT * FROM tools WHERE status = ?';
      const params: any[] = ['active'];

      if (toolIds && toolIds.length > 0) {
        query += ` AND id IN (${toolIds.map(() => '?').join(', ')})`;
        params.push(...toolIds);
      }

      const tools = this.db.prepare(query).all(...params) as any[];

      for (const toolRow of tools) {
        try {
          const tool = ToolModel.fromDatabase(toolRow);
          const discoveryResult = await this.discoverFromEndpoint(tool.endpoint, { 
            timeout: 10000,
            cacheTimeout: 0, // Force fresh discovery
          });

          if (discoveryResult.status === 'success' && discoveryResult.tools.length > 0) {
            // Find matching tool in discovery results
            const discoveredTool = discoveryResult.tools.find(t => t.name === tool.name);
            if (discoveredTool) {
              const updatedTool = ToolModel.update(tool, {
                capabilities: discoveredTool.capabilities,
                authConfig: discoveredTool.authConfig,
                schema: discoveredTool.schema,
                lastChecked: new Date().toISOString(),
              });

              // Save to database
              const dbData = ToolModel.toDatabase(updatedTool);
              const stmt = this.db.prepare(`
                UPDATE tools SET 
                  capabilities = ?, auth_config = ?, schema = ?, 
                  last_checked = ?, updated_at = ?
                WHERE id = ?
              `);

              stmt.run(
                dbData.capabilities, dbData.auth_config, dbData.schema,
                dbData.last_checked, dbData.updated_at, dbData.id
              );

              refreshed.push(updatedTool);
            } else {
              errors.push(`Tool ${tool.name} not found in discovery results`);
            }
          } else {
            errors.push(`Failed to refresh ${tool.name}: ${discoveryResult.error || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`Error refreshing tool: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

    } catch (error) {
      errors.push(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { refreshed, errors };
  }

  /**
   * Get discovery statistics
   */
  getStats(): {
    totalEndpoints: number;
    cacheHits: number;
    activeDiscoveries: number;
    cacheSize: number;
  } {
    return {
      totalEndpoints: this.cache.size,
      cacheHits: Array.from(this.cache.values()).filter(entry => entry.timestamp).length,
      activeDiscoveries: this.activeDiscoveries.size,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Private helper methods

  private async performDiscovery(endpoint: string, options: DiscoveryOptions): Promise<ToolDiscoveryResult> {
    const startTime = Date.now();

    try {
      // Validate endpoint URL
      try {
        new URL(endpoint);
      } catch {
        throw new Error(`Invalid endpoint URL: ${endpoint}`);
      }

      const result = await this.discoverWithRetry(endpoint, options);
      result.responseTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        tools: [],
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime,
        cached: false,
      };
    }
  }

  private async discoverWithRetry(endpoint: string, options: DiscoveryOptions): Promise<ToolDiscoveryResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.retryAttempts; attempt++) {
      try {
        return await this.makeDiscoveryRequest(endpoint, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < options.retryAttempts) {
          // Wait before retry with exponential backoff
          const delay = options.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Discovery failed');
  }

  private async makeDiscoveryRequest(endpoint: string, options: DiscoveryOptions): Promise<ToolDiscoveryResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      // Make MCP discovery request
      const response = await fetch(`${endpoint}/mcp/capabilities`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': options.userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Parse MCP capabilities response
      const tools = this.parseMCPCapabilities(endpoint, data);

      return {
        tools,
        endpoint,
        status: 'success',
        cached: false,
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseMCPCapabilities(endpoint: string, data: any): ToolCreate[] {
    const tools: ToolCreate[] = [];

    try {
      // Handle different MCP response formats
      if (data.tools && Array.isArray(data.tools)) {
        // Standard MCP tools format
        for (const toolData of data.tools) {
          const tool: ToolCreate = {
            name: toolData.name || 'unknown',
            version: toolData.version || '1.0.0',
            description: toolData.description,
            endpoint,
            capabilities: toolData.capabilities || [],
            authConfig: {
              type: toolData.auth?.type || 'api_key',
              required: toolData.auth?.required ?? true,
              description: toolData.auth?.description,
            },
            schema: toolData.schema,
            discoveryData: {
              discoveredAt: new Date().toISOString(),
              endpoint,
              serverInfo: data.server_info || data.info,
            },
            status: 'active',
          };

          tools.push(tool);
        }
      } else if (data.capabilities && Array.isArray(data.capabilities)) {
        // Simple capabilities format - create single tool
        const tool: ToolCreate = {
          name: data.name || new URL(endpoint).hostname,
          version: data.version || '1.0.0',
          description: data.description || `MCP tool at ${endpoint}`,
          endpoint,
          capabilities: data.capabilities,
          authConfig: {
            type: data.auth_type || 'api_key',
            required: data.auth_required ?? true,
          },
          discoveryData: {
            discoveredAt: new Date().toISOString(),
            endpoint,
          },
          status: 'active',
        };

        tools.push(tool);
      }

    } catch (error) {
      throw new Error(`Failed to parse MCP response: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (tools.length === 0) {
      throw new Error('No tools found in MCP response');
    }

    return tools;
  }

  private async updateExistingTool(toolId: string, toolData: ToolCreate): Promise<Tool | null> {
    try {
      const existingRow = this.db.prepare('SELECT * FROM tools WHERE id = ?').get(toolId) as any;
      if (!existingRow) {
        return null;
      }

      const existingTool = ToolModel.fromDatabase(existingRow);
      
      // Check if update is needed
      const needsUpdate = 
        existingTool.version !== toolData.version ||
        JSON.stringify(existingTool.capabilities) !== JSON.stringify(toolData.capabilities) ||
        JSON.stringify(existingTool.authConfig) !== JSON.stringify(toolData.authConfig);

      if (!needsUpdate) {
        // Just update last_checked
        const stmt = this.db.prepare('UPDATE tools SET last_checked = ? WHERE id = ?');
        stmt.run(new Date().toISOString(), toolId);
        return existingTool;
      }

      // Update tool with new data
      const updatedTool = ToolModel.update(existingTool, {
        version: toolData.version,
        description: toolData.description,
        capabilities: toolData.capabilities,
        authConfig: toolData.authConfig,
        schema: toolData.schema,
        discoveryData: toolData.discoveryData,
        lastChecked: new Date().toISOString(),
      });

      const dbData = ToolModel.toDatabase(updatedTool);
      const stmt = this.db.prepare(`
        UPDATE tools SET 
          version = ?, description = ?, capabilities = ?, 
          auth_config = ?, schema = ?, discovery_data = ?, 
          last_checked = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        dbData.version, dbData.description, dbData.capabilities,
        dbData.auth_config, dbData.schema, dbData.discovery_data,
        dbData.last_checked, dbData.updated_at, dbData.id
      );

      return updatedTool;

    } catch (error) {
      throw new Error(`Failed to update tool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getEnvironmentEndpoints(): string[] {
    const endpoints: string[] = [];
    
    // Check for MCP_ENDPOINTS environment variable
    const mcpEndpoints = process.env.MCP_ENDPOINTS;
    if (mcpEndpoints) {
      endpoints.push(...mcpEndpoints.split(',').map(e => e.trim()));
    }

    // Check for individual endpoint environment variables
    for (let i = 1; i <= 10; i++) {
      const endpoint = process.env[`MCP_ENDPOINT_${i}`];
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }

    return endpoints.filter(e => {
      try {
        new URL(e);
        return true;
      } catch {
        return false;
      }
    });
  }

  private getCacheKey(endpoint: string, options: DiscoveryOptions): string {
    return `${endpoint}:${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): ToolDiscoveryResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  private setCache(key: string, result: ToolDiscoveryResult, ttl: number): void {
    const timestamp = Date.now();
    this.cache.set(key, {
      result,
      timestamp,
      expiresAt: timestamp + (ttl * 1000),
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}