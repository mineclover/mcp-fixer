# Research: MCP Tool Management & Query System

**Date**: 2025-09-09  
**Purpose**: Resolve technical unknowns and NEEDS CLARIFICATION items from feature specification

## Research Findings

### 1. MCP Authentication Methods

**Decision**: Support API keys, Bearer tokens, and basic authentication initially  
**Rationale**: 
- MCP specification supports multiple authentication schemes via transport layer
- API keys and Bearer tokens are most common in CLI tools
- Basic auth provides compatibility with legacy systems
- OAuth can be added later as optional enhancement

**Alternatives considered**:
- OAuth 2.0 flows: Complex for CLI tools, requires browser interaction
- Client certificates: Added complexity for initial implementation
- Custom authentication: Non-standard, reduces interoperability

**Implementation approach**:
- Store auth configs per tool in SQLite with encryption
- Support auth headers, query parameters, and transport-level auth
- Implement token refresh for Bearer tokens with expiration

### 2. LangChain/LangGraph Integration

**Decision**: Optional integration with LangChain for complex orchestration  
**Rationale**:
- LangChain provides robust tool calling and workflow orchestration
- LangGraph offers state management for complex multi-step operations
- Can enhance query execution with intelligent parameter resolution
- Optional dependency maintains simplicity for basic use cases

**Alternatives considered**:
- Direct MCP SDK only: Simpler but limited orchestration capabilities
- Custom orchestration: Reinventing existing patterns
- Other frameworks: LangChain has best MCP integration support

**Implementation approach**:
- Core functionality built on MCP SDK directly
- LangChain integration as optional enhancement layer
- LangGraph for stateful query execution workflows
- Graceful fallback to direct MCP when LangChain unavailable

### 3. Credential Storage Security

**Decision**: AES-256 encryption with key derivation from system keychain  
**Rationale**:
- SQLite stores encrypted credential blobs
- System keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) for master key
- Key derivation prevents plaintext credential exposure
- Local-first approach maintains privacy

**Alternatives considered**:
- Plaintext storage: Security risk, unacceptable
- Environment variables: Not persistent, user burden
- External key management: Adds complexity, network dependency

**Implementation approach**:
- Use `node:crypto` for AES-256-GCM encryption
- System keychain integration via `keytar` or similar
- Fallback to encrypted file with user-provided passphrase
- Automatic key rotation on credential updates

### 4. Query Versioning Strategies

**Decision**: Semantic versioning with automatic migration and compatibility matrix  
**Rationale**:
- Tool API changes are inevitable, need forward compatibility
- Version compatibility allows graceful degradation
- Automatic migration reduces user friction
- Fallback to manual updates for complex changes

**Alternatives considered**:
- No versioning: Breaks queries when tools change
- Manual updates only: High user burden
- Full API mirroring: Complex, storage intensive

**Implementation approach**:
- Store query schema version with each saved query
- Maintain compatibility matrix for tool API versions
- Automatic parameter mapping for minor changes
- Migration warnings and manual approval for major changes
- Query validation before execution

### 5. Data Collector Architecture

**Decision**: Plugin-based architecture with TypeScript modules  
**Rationale**:
- TypeScript provides type safety for collector interfaces
- File system based loading enables easy extension
- Validation ensures output compatibility
- Sandboxed execution prevents collector conflicts

**Alternatives considered**:
- JavaScript-only: Less type safety
- External executables: Process overhead, security concerns
- Registry-based: Adds complexity, central point of failure

**Implementation approach**:
- Standard collector interface with TypeScript types
- File system discovery in collectors/ directory
- Zod schemas for input/output validation
- Isolated execution context per collector
- Error handling and timeout management

## Validation Rules for Data Collector Output

**Decision**: Schema-based validation with runtime type checking  
**Rationale**:
- Zod provides runtime validation and TypeScript integration
- JSON Schema compatibility for interoperability
- Clear error messages for validation failures
- Extensible for custom validation rules

**Validation approach**:
- Each query defines expected input schema
- Collectors declare output schema compatibility
- Runtime validation before query execution
- Type coercion for compatible types (string to number, etc.)
- Detailed error reporting for incompatible data

## Performance Considerations

### Query Execution Optimization
- SQLite query optimization with proper indexing
- Credential caching to avoid repeated keychain access
- Parallel execution for independent operations
- Request/response streaming for large data sets

### Tool Discovery Efficiency
- Incremental discovery with change detection
- Capability caching with TTL expiration
- Batch operations for multiple tool queries
- Background refresh for updated tool definitions

### Memory Management
- Streaming JSON processing for large responses
- Garbage collection optimization for long-running processes
- Connection pooling for database operations
- Resource cleanup for failed operations

## Security Considerations

### Credential Protection
- No credentials in logs or error messages
- Secure memory handling for sensitive data
- Automatic credential expiration and rotation
- Audit logging for credential access

### Code Execution Safety
- Sandboxed data collector execution
- Input validation and sanitization
- Resource limits for collector operations
- No dynamic code evaluation

### Network Security
- TLS verification for all external connections
- Certificate pinning for critical services
- Request/response size limits
- Rate limiting for API calls

## Dependencies Resolution

### Core Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^0.1.0",
  "sqlite3": "bun:sqlite",
  "zod": "^3.22.0",
  "commander": "^11.0.0"
}
```

### Optional Dependencies
```json
{
  "@langchain/core": "^0.1.0",
  "langchain": "^0.1.0",
  "langgraph": "^0.1.0",
  "keytar": "^7.9.0"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "typescript": "^5.2.0",
  "@types/jest": "^29.0.0",
  "jest": "^29.0.0"
}
```

## Error Handling Strategy

### Error Categories
1. **Network errors**: Retry with exponential backoff
2. **Authentication errors**: Prompt for credential refresh
3. **Validation errors**: Clear messages with correction suggestions
4. **Tool errors**: Graceful degradation with fallback options
5. **Storage errors**: Data recovery and corruption handling

### Error Context
- Full error chain preservation
- Request/response logging (without credentials)
- User action recommendations
- Error code classification for programmatic handling

## Configuration Management

### Configuration Sources (priority order)
1. Command-line arguments
2. Environment variables
3. Configuration file (~/.mcp-tool/config.json)
4. Default values

### Configuration Schema
```typescript
interface Config {
  database: {
    path: string;
    maxConnections: number;
    timeout: number;
  };
  security: {
    encryptionEnabled: boolean;
    keyDerivationRounds: number;
    credentialTTL: number;
  };
  discovery: {
    cacheTimeout: number;
    maxConcurrency: number;
    retryAttempts: number;
  };
  performance: {
    queryTimeout: number;
    maxMemoryUsage: number;
    enableStreaming: boolean;
  };
}
```

---

## Resolution Summary

All NEEDS CLARIFICATION items have been researched and resolved:

✅ **MCP Authentication Methods**: API keys, Bearer tokens, basic auth  
✅ **Credential Storage Duration**: Persistent with configurable TTL  
✅ **Data Collector Validation**: Schema-based with Zod runtime validation  
✅ **Query Versioning**: Semantic versioning with compatibility matrix  
✅ **LangChain Integration**: Optional orchestration layer  

**Next Phase**: Proceed to Phase 1 (Design & Contracts) with all technical decisions documented.