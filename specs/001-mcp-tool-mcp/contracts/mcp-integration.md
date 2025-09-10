# MCP Integration Contract

**Date**: 2025-09-09  
**Purpose**: Define integration contracts with Model Context Protocol tools

## MCP Client Interface

### Tool Discovery Contract

```typescript
interface ToolDiscovery {
  discover(endpoint: string, options?: DiscoveryOptions): Promise<ToolDiscoveryResult>;
  validateCapabilities(tool: MCPTool): Promise<ValidationResult>;
  testConnection(tool: MCPTool): Promise<ConnectionResult>;
}

interface DiscoveryOptions {
  timeout?: number;
  auth?: AuthConfig;
  retryAttempts?: number;
}

interface ToolDiscoveryResult {
  tool: MCPToolInfo;
  capabilities: MCPCapability[];
  authRequirement: AuthRequirement;
  schemas: MCPSchemas;
  metadata: Record<string, unknown>;
}

interface MCPToolInfo {
  name: string;
  version: string;
  description?: string;
  implementation: {
    name: string;
    version: string;
  };
}

interface MCPCapability {
  name: string;
  description?: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  parameters: MCPParameter[];
}

interface MCPParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
}
```

### Authentication Contract

```typescript
interface AuthenticationHandler {
  authenticate(tool: MCPTool, credentials: CredentialData): Promise<AuthResult>;
  refreshToken(tool: MCPTool, credential: StoredCredential): Promise<AuthResult>;
  validateCredentials(tool: MCPTool, credential: StoredCredential): Promise<boolean>;
}

interface CredentialData {
  type: 'api_key' | 'bearer' | 'basic' | 'oauth';
  data: Record<string, string>;
  expiresAt?: Date;
}

interface AuthResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
  refreshToken?: string;
}

interface AuthRequirement {
  required: boolean;
  methods: AuthMethod[];
  description?: string;
}

interface AuthMethod {
  type: string;
  description?: string;
  parameters: string[];
}
```

### Tool Execution Contract

```typescript
interface ToolExecution {
  execute(
    tool: MCPTool, 
    operation: string, 
    parameters: Record<string, unknown>,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;
  
  stream(
    tool: MCPTool,
    operation: string,
    parameters: Record<string, unknown>,
    options?: ExecutionOptions
  ): AsyncIterableIterator<ExecutionChunk>;
}

interface ExecutionOptions {
  timeout?: number;
  credential?: StoredCredential;
  validateOutput?: boolean;
  streaming?: boolean;
}

interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: ExecutionError;
  metadata: {
    duration: number;
    tool: string;
    operation: string;
    timestamp: Date;
  };
}

interface ExecutionChunk {
  type: 'data' | 'error' | 'complete';
  data?: unknown;
  error?: ExecutionError;
  progress?: number;
}

interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}
```

## MCP Server Requirements

### Server Capabilities Detection

```typescript
interface ServerCapabilities {
  // Required MCP methods
  listTools(): Promise<Tool[]>;
  callTool(request: ToolRequest): Promise<ToolResponse>;
  
  // Optional methods for enhanced functionality
  getSchema?(toolName: string): Promise<JSONSchema>;
  validateParameters?(toolName: string, params: Record<string, unknown>): Promise<ValidationResult>;
  describeOperation?(toolName: string, operation: string): Promise<OperationDescription>;
}

interface Tool {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

interface ToolRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

interface ToolResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}
```

### Transport Layer Support

```typescript
interface TransportAdapter {
  connect(endpoint: string, options?: TransportOptions): Promise<Connection>;
  disconnect(connection: Connection): Promise<void>;
  send(connection: Connection, message: MCPMessage): Promise<MCPResponse>;
}

interface TransportOptions {
  timeout?: number;
  auth?: AuthConfig;
  headers?: Record<string, string>;
  retries?: number;
}

interface Connection {
  id: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
}

interface MCPMessage {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: string | number;
}
```

## Query Execution Integration

### Query to MCP Operation Mapping

```typescript
interface QueryExecutor {
  executeQuery(query: SavedQuery, parameters: Record<string, unknown>): Promise<QueryResult>;
  validateQueryCompatibility(query: SavedQuery, tool: MCPTool): Promise<CompatibilityResult>;
  migrateQuery(query: SavedQuery, newToolVersion: string): Promise<MigrationResult>;
}

interface QueryResult {
  executionId: string;
  query: SavedQuery;
  parameters: Record<string, unknown>;
  result: ExecutionResult;
  collectorInputs?: CollectorResult[];
  timing: {
    started: Date;
    completed: Date;
    duration: number;
  };
}

interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  suggestions?: string[];
  autoFixable: boolean;
}

interface CompatibilityIssue {
  type: 'parameter_mismatch' | 'operation_removed' | 'schema_changed' | 'auth_changed';
  severity: 'error' | 'warning' | 'info';
  description: string;
  affected: string[];
}

interface MigrationResult {
  success: boolean;
  migratedQuery?: SavedQuery;
  changes: MigrationChange[];
  manualStepsRequired?: string[];
}

interface MigrationChange {
  type: 'parameter_renamed' | 'parameter_removed' | 'parameter_added' | 'operation_changed';
  description: string;
  automatic: boolean;
}
```

## Data Collector Integration

### Collector Execution Contract

```typescript
interface CollectorExecutor {
  executeCollector(
    collector: DataCollector, 
    input: Record<string, unknown>
  ): Promise<CollectorResult>;
  
  validateCollectorOutput(
    collector: DataCollector, 
    output: unknown
  ): Promise<ValidationResult>;
}

interface CollectorResult {
  collectorId: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
  timing: {
    started: Date;
    completed: Date;
    duration: number;
  };
}

interface CollectorInterface {
  // Standard collector module interface
  execute(input: CollectorInput): Promise<CollectorOutput>;
  validate?(input: unknown): Promise<ValidationResult>;
  describe(): CollectorDescription;
}

interface CollectorInput {
  parameters: Record<string, unknown>;
  context: {
    workingDirectory: string;
    environment: Record<string, string>;
    timeout: number;
  };
}

interface CollectorOutput {
  data: unknown;
  metadata?: Record<string, unknown>;
  warnings?: string[];
}

interface CollectorDescription {
  name: string;
  version: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  requirements?: string[];
}
```

## Error Handling and Recovery

### Error Classification

```typescript
interface ErrorHandler {
  classifyError(error: unknown): ErrorClassification;
  shouldRetry(error: ErrorClassification): boolean;
  getRecoveryStrategy(error: ErrorClassification): RecoveryStrategy;
}

interface ErrorClassification {
  category: 'network' | 'auth' | 'validation' | 'tool' | 'system';
  severity: 'fatal' | 'error' | 'warning';
  retryable: boolean;
  userActionRequired: boolean;
}

interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'user_intervention' | 'graceful_degradation';
  description: string;
  steps: RecoveryStep[];
  maxAttempts?: number;
  backoffStrategy?: 'exponential' | 'linear' | 'fixed';
}

interface RecoveryStep {
  action: string;
  description: string;
  automatic: boolean;
  timeout?: number;
}
```

### Circuit Breaker Pattern

```typescript
interface CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'closed' | 'open' | 'half_open';
  reset(): void;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors: string[];
}
```

## Performance Optimization

### Caching Strategy

```typescript
interface CacheManager {
  getToolCapabilities(toolId: string): Promise<MCPCapability[] | null>;
  setToolCapabilities(toolId: string, capabilities: MCPCapability[], ttl?: number): Promise<void>;
  
  getAuthToken(toolId: string): Promise<string | null>;
  setAuthToken(toolId: string, token: string, expiresAt?: Date): Promise<void>;
  
  invalidateToolCache(toolId: string): Promise<void>;
  clearExpiredCache(): Promise<void>;
}
```

### Connection Pooling

```typescript
interface ConnectionPool {
  getConnection(endpoint: string): Promise<Connection>;
  releaseConnection(connection: Connection): Promise<void>;
  closeAll(): Promise<void>;
  getStats(): PoolStats;
}

interface PoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  waitingRequests: number;
}
```

## Testing Contracts

### Mock MCP Server

```typescript
interface MockMCPServer {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  addTool(tool: MockTool): void;
  setAuthRequirement(requirement: AuthRequirement): void;
  simulateError(errorType: string, probability: number): void;
}

interface MockTool {
  name: string;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
  schema: JSONSchema;
  authRequired?: boolean;
}
```

### Integration Test Helpers

```typescript
interface TestHelpers {
  createTestDatabase(): Promise<string>;
  seedTestData(dbPath: string): Promise<void>;
  createMockCollector(schema: CollectorDescription): Promise<string>;
  cleanupTestResources(): Promise<void>;
}
```

---

**Next**: Generate database contracts and quickstart guide