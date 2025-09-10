# API Integration Contracts: MCP Fixed Interface System

**Feature**: 002-claude-mcp-add  
**Date**: 2025-09-10  
**Dependencies**: MCP SDK integration from 001-mcp-tool-mcp

## MCP Server Integration Contracts

### 1. Context7 Integration

**Server Details**:
- **Transport**: HTTP
- **Endpoint**: https://mcp.context7.com/mcp
- **Authentication**: API key or OAuth (to be determined during implementation)
- **Purpose**: Documentation search and retrieval

**Fixed Interface Candidates**:

#### search-docs Interface
**MCP Tool Name**: `search_documentation`
**Purpose**: Search through library documentation
**Parameters**:
```json
{
  "query": "string (required)",
  "library": "string (optional)", 
  "limit": "number (optional, default: 10)",
  "format": "string (optional: 'markdown'|'text', default: 'markdown')"
}
```
**Response Schema**:
```json
{
  "results": [
    {
      "title": "string",
      "content": "string", 
      "url": "string",
      "library": "string",
      "relevance": "number"
    }
  ],
  "total": "number",
  "query": "string"
}
```

#### get-library-info Interface
**MCP Tool Name**: `get_library_information`
**Purpose**: Get information about a specific library
**Parameters**:
```json
{
  "library": "string (required)",
  "version": "string (optional)"
}
```
**Response Schema**:
```json
{
  "name": "string",
  "version": "string",
  "description": "string",
  "documentation_url": "string",
  "api_reference": "string",
  "examples": ["string"]
}
```

**Integration Requirements**:
- Response time target: <2s for search, <500ms for library info
- Rate limiting: Respect server limits, implement client-side throttling
- Error handling: Handle 429 (rate limit), 503 (server unavailable)
- Caching: Cache library information for 1 hour, search results for 5 minutes

### 2. Notion Integration

**Server Details**:
- **Transport**: HTTP  
- **Endpoint**: https://mcp.notion.com/mcp
- **Authentication**: OAuth 2.0 (Authorization Code with PKCE)
- **Purpose**: Notion workspace management and content operations

**OAuth Configuration**:
```json
{
  "providerName": "notion",
  "authorizationUrl": "https://api.notion.com/v1/oauth/authorize",
  "tokenUrl": "https://api.notion.com/v1/oauth/token",
  "scopes": ["read_content", "insert_content", "update_content"],
  "additionalParams": {
    "owner": "user"
  }
}
```

**Fixed Interface Candidates**:

#### create-page Interface  
**MCP Tool Name**: `create_page`
**Purpose**: Create a new page in Notion workspace
**Parameters**:
```json
{
  "parent": {
    "database_id": "string (optional)",
    "page_id": "string (optional)"
  },
  "properties": {
    "title": [
      {
        "text": {
          "content": "string (required)"
        }
      }
    ]
  },
  "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "text": {
              "content": "string"
            }
          }
        ]
      }
    }
  ]
}
```
**Response Schema**:
```json
{
  "object": "page",
  "id": "string",
  "created_time": "string",
  "last_edited_time": "string", 
  "url": "string",
  "properties": "object"
}
```

#### search-pages Interface
**MCP Tool Name**: `search_pages`
**Purpose**: Search pages in Notion workspace
**Parameters**:
```json
{
  "query": "string (required)",
  "filter": {
    "value": "page",
    "property": "object"
  },
  "sort": {
    "direction": "descending",
    "timestamp": "last_edited_time"  
  },
  "start_cursor": "string (optional)",
  "page_size": "number (optional, max: 100)"
}
```
**Response Schema**:
```json
{
  "object": "list",
  "results": [
    {
      "object": "page",
      "id": "string",
      "url": "string", 
      "properties": "object"
    }
  ],
  "next_cursor": "string",
  "has_more": "boolean"
}
```

**OAuth Integration Requirements**:
- **Token Storage**: Encrypted access and refresh tokens
- **Token Refresh**: Automatic refresh before expiration  
- **Scope Validation**: Verify granted scopes match requested
- **Error Handling**: Handle 401 (unauthorized), 403 (forbidden), token expiry
- **Security**: Never log tokens, secure token transmission

### 3. Generic MCP Server Interface

**Discovery Contract**:
All MCP servers must support standard MCP protocol operations:

#### Tool Discovery
**Operation**: `tools/list`
**Purpose**: Get available tools from MCP server
**Parameters**: None
**Response**: Array of tool definitions with schemas

#### Tool Invocation  
**Operation**: `tools/call`
**Purpose**: Execute specific tool with parameters
**Parameters**:
```json
{
  "name": "string (required)",
  "arguments": "object (required)"
}
```
**Response**: Tool-specific result object

**Fixed Interface Registration Process**:
1. **Discovery**: Call `tools/list` to get available tools
2. **Schema Extraction**: Extract parameter and response schemas  
3. **Validation**: Test tool invocation with sample data
4. **Registration**: Store validated schema as fixed interface
5. **Monitoring**: Periodic re-validation against live server

## Error Handling Contracts

### MCP Server Error Mapping
```json
{
  "mcp_errors": {
    "InvalidRequest": {
      "code": "INVALID_REQUEST", 
      "http_status": 400,
      "message": "Request format invalid"
    },
    "MethodNotFound": {
      "code": "METHOD_NOT_FOUND",
      "http_status": 404, 
      "message": "MCP method not supported"
    },
    "InvalidParams": {
      "code": "INVALID_PARAMS",
      "http_status": 422,
      "message": "Parameter validation failed"
    },
    "InternalError": {
      "code": "MCP_SERVER_ERROR",
      "http_status": 502,
      "message": "MCP server internal error"
    }
  }
}
```

### Authentication Error Handling
```json
{
  "auth_errors": {
    "TokenExpired": {
      "code": "AUTH_TOKEN_EXPIRED",
      "action": "refresh_token",
      "message": "Access token expired, attempting refresh"
    },
    "RefreshFailed": {
      "code": "AUTH_REFRESH_FAILED", 
      "action": "reauthorize",
      "message": "Token refresh failed, re-authorization required"
    },
    "InsufficientScope": {
      "code": "AUTH_INSUFFICIENT_SCOPE",
      "action": "reauthorize",
      "message": "Additional permissions required"
    }
  }
}
```

### Network Error Handling
- **Timeout**: 30s default, configurable per interface
- **Retry Policy**: Exponential backoff for transient errors
- **Circuit Breaker**: Fail fast after 5 consecutive failures
- **Fallback**: Use dynamic discovery when fixed interface fails

## Performance Contracts

### Response Time Targets
- **Fixed Interface Access**: <100ms (target <50ms)
- **OAuth Token Refresh**: <500ms
- **Interface Validation**: <1s
- **Dynamic Discovery Fallback**: <2s (maintain existing performance)

### Caching Strategy
- **Interface Schemas**: Cache indefinitely, validate periodically
- **OAuth Tokens**: Cache until expiry, auto-refresh
- **API Responses**: Cache based on tool-specific TTL rules
- **Performance Metrics**: Real-time collection, batch persistence

### Resource Management
- **Memory**: <50MB additional memory for interface cache
- **Storage**: <10MB database growth for typical usage (50 interfaces)
- **Network**: Minimize requests through intelligent caching
- **CPU**: <5% additional CPU for interface management overhead

## Security Contracts

### Token Security
- **Encryption**: AES-256-GCM for token storage
- **Key Management**: OS keyring integration for encryption keys
- **Transmission**: HTTPS only, certificate pinning where possible
- **Rotation**: Support automatic token rotation

### Data Protection
- **Sensitive Data**: Never log tokens, credentials, or user data
- **Audit Logging**: Log authentication events and errors only
- **Data Retention**: Automatic cleanup of expired tokens and old metrics
- **Access Control**: Validate user permissions before interface access

---

**Status**: Complete ✓  
**Next**: Generate quickstart guide and test scenarios