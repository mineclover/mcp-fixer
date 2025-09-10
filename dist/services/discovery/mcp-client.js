import { z } from 'zod';
import fetch from 'node-fetch';
// MCP request/response schemas
const MCPRequestSchema = z.object({
    method: z.string(),
    params: z.record(z.string(), z.any()).optional(),
    id: z.union([z.string(), z.number()]).optional(),
});
const MCPResponseSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    result: z.any().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
    }).optional(),
});
// MCP client options
const MCPClientOptionsSchema = z.object({
    timeout: z.number().positive().default(30000),
    retryAttempts: z.number().min(0).default(3),
    retryDelay: z.number().positive().default(1000),
    userAgent: z.string().default('mcp-tool/1.0.0'),
    validateResponse: z.boolean().default(true),
});
// MCP operation result
const MCPOperationResultSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    responseTime: z.number(),
    requestId: z.union([z.string(), z.number()]).optional(),
});
export class MCPClient {
    db;
    config;
    authManager;
    requestCounter = 0;
    constructor(db, config, authManager) {
        this.db = db;
        this.config = config;
        this.authManager = authManager;
    }
    /**
     * Call a tool method with parameters
     */
    async callTool(tool, method, params = {}, options = {}) {
        const opts = MCPClientOptionsSchema.parse({
            ...this.config.performance,
            timeout: this.config.performance.queryTimeout * 1000,
            ...options,
        });
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            // Get authentication credentials
            const credentialInfo = await this.authManager.getCredentials(tool.id);
            if (!credentialInfo) {
                throw new Error(`No credentials found for tool '${tool.name}'`);
            }
            // Prepare MCP request
            const mcpRequest = {
                method,
                params,
                id: requestId,
            };
            // Make authenticated request
            const response = await this.makeAuthenticatedRequest(tool, mcpRequest, credentialInfo.credential.authType, credentialInfo.data, opts);
            // Validate and parse response
            if (opts.validateResponse) {
                const validation = MCPResponseSchema.safeParse(response);
                if (!validation.success) {
                    throw new Error(`Invalid MCP response: ${validation.error.message}`);
                }
            }
            const mcpResponse = response;
            if (mcpResponse.error) {
                throw new Error(`MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message}`);
            }
            return {
                success: true,
                data: mcpResponse.result,
                responseTime: Date.now() - startTime,
                requestId,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: Date.now() - startTime,
                requestId,
            };
        }
    }
    /**
     * List available resources from a tool
     */
    async listResources(tool, options = {}) {
        return this.callTool(tool, 'list_resources', {}, options);
    }
    /**
     * Read a resource from a tool
     */
    async readResource(tool, uri, options = {}) {
        return this.callTool(tool, 'read_resource', { uri }, options);
    }
    /**
     * List available tools from an MCP server
     */
    async listTools(tool, options = {}) {
        return this.callTool(tool, 'list_tools', {}, options);
    }
    /**
     * Call a specific tool function
     */
    async callToolFunction(tool, functionName, arguments_ = {}, options = {}) {
        return this.callTool(tool, 'call_tool', {
            name: functionName,
            arguments: arguments_,
        }, options);
    }
    /**
     * List available prompts from a tool
     */
    async listPrompts(tool, options = {}) {
        return this.callTool(tool, 'list_prompts', {}, options);
    }
    /**
     * Get a prompt from a tool
     */
    async getPrompt(tool, name, arguments_ = {}, options = {}) {
        return this.callTool(tool, 'get_prompt', {
            name,
            arguments: arguments_,
        }, options);
    }
    /**
     * Test connection to a tool
     */
    async testConnection(tool) {
        const startTime = Date.now();
        try {
            // Try to get server info or capabilities
            const result = await this.makeSimpleRequest(tool.endpoint, {
                method: 'server_info',
                id: this.generateRequestId(),
            }, {
                timeout: 10000,
                retryAttempts: 1,
            });
            return {
                success: true,
                data: result,
                responseTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: Date.now() - startTime,
            };
        }
    }
    /**
     * Subscribe to resource updates
     */
    async subscribeResource(tool, uri, options = {}) {
        return this.callTool(tool, 'subscribe_resource', { uri }, options);
    }
    /**
     * Unsubscribe from resource updates
     */
    async unsubscribeResource(tool, uri, options = {}) {
        return this.callTool(tool, 'unsubscribe_resource', { uri }, options);
    }
    /**
     * Get server capabilities and information
     */
    async getServerInfo(tool) {
        return this.callTool(tool, 'server_info', {}, {
            timeout: 10000,
            retryAttempts: 1,
        });
    }
    // Private helper methods
    async makeAuthenticatedRequest(tool, request, authType, credentialData, options) {
        // Create authentication headers
        const headers = this.authManager.createAuthHeaders(authType, credentialData);
        // Add standard headers
        headers['Content-Type'] = 'application/json';
        headers['Accept'] = 'application/json';
        headers['User-Agent'] = options.userAgent;
        return this.makeRequestWithRetry(tool.endpoint, request, headers, options);
    }
    async makeSimpleRequest(endpoint, request, options) {
        const opts = MCPClientOptionsSchema.parse({
            ...this.config.performance,
            ...options,
        });
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': opts.userAgent,
        };
        return this.makeRequestWithRetry(endpoint, request, headers, opts);
    }
    async makeRequestWithRetry(endpoint, request, headers, options) {
        let lastError = null;
        for (let attempt = 0; attempt <= options.retryAttempts; attempt++) {
            try {
                return await this.makeHttpRequest(endpoint, request, headers, options);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Don't retry on authentication errors
                if (lastError.message.includes('401') || lastError.message.includes('403')) {
                    throw lastError;
                }
                if (attempt < options.retryAttempts) {
                    // Wait before retry with exponential backoff
                    const delay = options.retryDelay * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('Request failed');
    }
    async makeHttpRequest(endpoint, request, headers, options) {
        // Ensure endpoint has /mcp path for MCP requests
        const url = endpoint.endsWith('/mcp') ? endpoint : `${endpoint}/mcp`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    generateRequestId() {
        return `mcp_${Date.now()}_${++this.requestCounter}`;
    }
    /**
     * Validate tool capabilities against a requested operation
     */
    validateCapability(tool, capability) {
        return tool.capabilities.includes(capability);
    }
    /**
     * Get supported capabilities for common operations
     */
    static getRequiredCapabilities() {
        return {
            listResources: 'list_resources',
            readResource: 'read_resource',
            subscribeResource: 'subscribe_resource',
            listTools: 'list_tools',
            callTool: 'call_tool',
            listPrompts: 'list_prompts',
            getPrompt: 'get_prompt',
        };
    }
    /**
     * Check if a tool supports a specific operation
     */
    supportsOperation(tool, operation) {
        const requiredCapabilities = MCPClient.getRequiredCapabilities();
        const requiredCapability = requiredCapabilities[operation];
        if (!requiredCapability) {
            return false;
        }
        return this.validateCapability(tool, requiredCapability);
    }
    /**
     * Get client statistics
     */
    getStats() {
        return {
            requestCount: this.requestCounter,
            activeSessions: 0, // TODO: Track active sessions if needed
        };
    }
    /**
     * Reset client state
     */
    reset() {
        this.requestCounter = 0;
    }
}
