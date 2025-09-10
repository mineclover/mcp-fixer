# Research: MCP Server Fixed Interface Optimization

**Feature**: 002-claude-mcp-add  
**Date**: 2025-09-10  

## Research Objectives

Based on Technical Context analysis, resolve these key areas:
1. Interface specification storage format and validation
2. OAuth 2.0 integration patterns for MCP servers  
3. Performance optimization strategies for interface caching
4. Interface versioning and compatibility management
5. Database schema extensions for fixed interface storage

## Research Findings

### Interface Specification Storage Format

**Decision**: JSON Schema-based interface specifications with Zod validation
**Rationale**: 
- Leverages existing Zod validation from 001-mcp-tool-mcp project
- JSON Schema provides standardized interface definition
- Compatible with MCP SDK tool schema format
- Enables runtime validation and type safety

**Alternatives considered**:
- OpenAPI 3.x format (too heavy for simple tool definitions)
- Custom YAML format (lacks validation ecosystem)
- Protocol Buffer definitions (adds complexity)

**Implementation approach**:
```typescript
interface FixedInterfaceSpec {
  id: string;
  mcpServerId: string;
  toolName: string;
  schema: z.ZodSchema;
  parameters: Record<string, any>;
  responseFormat: z.ZodSchema;
  createdAt: Date;
  lastValidated: Date;
  version: string;
}
```

### OAuth 2.0 Integration for MCP Servers

**Decision**: OAuth 2.0 Authorization Code flow with PKCE support
**Rationale**:
- Notion MCP server requires OAuth 2.0 (test case requirement)
- PKCE provides security for CLI applications without client secret
- Authorization Code flow is standard for third-party integrations
- Supports token refresh for long-lived CLI usage

**Alternatives considered**:
- Client Credentials flow (doesn't work for user-scoped access)
- Device Authorization flow (more complex UX for CLI)
- Resource Owner Password flow (deprecated, insecure)

**Implementation approach**:
- Extend existing credential storage from 001 spec
- Add OAuth token management with automatic refresh
- Store encrypted refresh tokens in SQLite database
- Support multiple OAuth providers through configuration

### Performance Optimization Strategies

**Decision**: Multi-tier caching with performance budgets
**Rationale**:
- <100ms response time target requires eliminating dynamic discovery
- Memory cache for frequently used interfaces
- Database persistence for durability
- Background validation to maintain cache freshness

**Cache architecture**:
1. **Memory tier**: In-process Map for active interfaces (<10ms access)
2. **Database tier**: SQLite with indexed lookups (<50ms access)  
3. **Validation tier**: Background health checks every 5 minutes
4. **Fallback tier**: Dynamic discovery when cache miss occurs

**Performance budgets**:
- Fixed interface access: <100ms (target <50ms)
- Dynamic discovery fallback: <2s (maintain existing performance)
- OAuth token refresh: <500ms
- Interface validation: <1s

### Interface Versioning Strategy

**Decision**: Semantic versioning with backward compatibility checks
**Rationale**:
- MCP server tools may change over time
- Need to detect breaking changes vs. compatible additions
- Allow graceful degradation when interfaces become outdated

**Versioning approach**:
- Store interface specification version alongside MCP server version
- Perform periodic validation against live MCP server
- Flag incompatible interfaces for re-registration
- Support side-by-side versions during migration periods

**Compatibility detection**:
- Schema comparison for parameter changes
- Response format validation
- Error handling differences
- Performance characteristic changes

### Database Schema Extensions

**Decision**: Extend existing SQLite schema with new tables
**Rationale**:
- Build on existing 001-mcp-tool-mcp database foundation
- Reuse existing tools and credentials tables where possible
- Add foreign key relationships for data consistency

**New tables**:
```sql
-- Fixed interface specifications
CREATE TABLE fixed_interfaces (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  schema_json TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  response_schema_json TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  last_validated DATETIME,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (tool_id) REFERENCES tools(id)
);

-- OAuth tokens and configuration
CREATE TABLE oauth_configurations (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  authorization_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id)
);

CREATE TABLE oauth_tokens (
  id TEXT PRIMARY KEY,
  oauth_config_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at DATETIME,
  scope TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (oauth_config_id) REFERENCES oauth_configurations(id)
);

-- Performance metrics for fixed vs dynamic access
CREATE TABLE performance_metrics (
  id TEXT PRIMARY KEY,
  interface_id TEXT,
  access_type TEXT CHECK(access_type IN ('fixed', 'dynamic')),
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (interface_id) REFERENCES fixed_interfaces(id)
);
```

## Technology Integration Research

### MCP SDK Integration Points

**Current 001 Integration**: Uses @modelcontextprotocol/sdk for dynamic discovery
**Extension Strategy**: 
- Leverage existing MCP client infrastructure
- Add interface specification caching layer
- Maintain compatibility with existing discovery workflows

**Key integration points**:
- Tool schema extraction and validation
- Authentication flow integration  
- Error handling for interface mismatches
- Performance monitoring integration

### Testing Strategy for Real MCP Servers

**Context7 Integration Testing**:
- Document retrieval operations with caching
- API rate limiting and error handling
- Interface specification validation

**Notion Integration Testing**:
- OAuth 2.0 authorization flow end-to-end
- Token refresh handling
- Scoped API access validation
- Error scenarios (token expiry, permission changes)

**Test Environment Setup**:
- Dedicated test credentials for both services
- Automated test data cleanup
- Integration test isolation
- Performance benchmarking framework

## Risk Assessment

**High Risk Areas**:
1. OAuth token security - encrypted storage critical
2. Interface compatibility detection - false positives could break workflows
3. Performance regression - caching must not slow down dynamic discovery fallback

**Mitigation Strategies**:
1. Use established encryption libraries, audit storage patterns
2. Implement comprehensive schema comparison with testing
3. Maintain separate code paths for fixed vs dynamic access

## Dependencies and Prerequisites

**From 001-mcp-tool-mcp**:
- SQLite database infrastructure ✓
- MCP SDK client configuration ✓
- Authentication credential storage ✓
- CLI command framework ✓

**New Dependencies Needed**:
- OAuth 2.0 client library (node-oauth2-server or similar)
- JSON Schema validation library (ajv - complements Zod)
- Performance monitoring utilities
- Database migration tooling

**External Services**:
- Context7 MCP server for testing
- Notion API for OAuth testing  
- Token endpoint access for both services

## Success Criteria

**Performance Validation**:
- Fixed interface access consistently <100ms
- 90th percentile performance improvement vs dynamic discovery
- OAuth flow completion <5 seconds for first-time setup

**Functionality Validation**:  
- Successfully register and use Context7 interfaces
- Complete OAuth flow with Notion MCP server
- Handle interface version changes gracefully
- Maintain compatibility with existing 001 workflows

**Security Validation**:
- OAuth tokens encrypted at rest
- Token refresh without user intervention  
- Graceful handling of revoked/expired credentials

---

**Status**: Complete ✓
**Next Phase**: Design & Contracts (Phase 1)