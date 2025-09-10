# CLI Command Contracts: Fixed Interface Management

**Feature**: 002-claude-mcp-add  
**Date**: 2025-09-10

## Command Structure

All commands extend the existing `mcp-tool` CLI from 001-mcp-tool-mcp with new `fixed` subcommand group.

### Base Command Format
```bash
mcp-tool fixed <action> [options] [arguments]
```

## Command Specifications

### 1. Register Fixed Interface

**Command**: `mcp-tool fixed register <tool-id> <operation-name> [options]`

**Purpose**: Register a successful MCP operation as a fixed interface

**Parameters**:
- `tool-id` (required): Tool identifier from existing tools table
- `operation-name` (required): MCP tool operation name to register
- `--name <name>` (optional): Custom name for fixed interface (default: operation-name)
- `--description <desc>` (optional): Description of interface purpose
- `--test` (flag): Test interface before registration
- `--force` (flag): Force registration even if validation fails

**Input Validation**:
- `tool-id` must exist in tools table
- `operation-name` must be valid MCP tool name
- `name` must be unique within tool scope
- Interface must validate successfully unless `--force` used

**Output Format** (JSON):
```json
{
  "success": true,
  "data": {
    "interfaceId": "uuid",
    "name": "string",
    "toolId": "string", 
    "version": "1.0.0",
    "isActive": true,
    "validatedAt": "2025-09-10T12:00:00Z"
  }
}
```

**Error Cases**:
- Tool not found → 404 error
- Interface name conflict → 409 error  
- Validation failure → 422 error with details
- MCP server unreachable → 503 error

### 2. List Fixed Interfaces

**Command**: `mcp-tool fixed list [tool-id] [options]`

**Purpose**: Display all registered fixed interfaces

**Parameters**:
- `tool-id` (optional): Filter by specific tool
- `--active` (flag): Show only active interfaces
- `--format <json|table|csv>` (default: table): Output format
- `--include-performance` (flag): Include performance metrics

**Output Format** (Table):
```
ID       | Name           | Tool      | Version | Status | Last Validated
---------|----------------|-----------|---------|--------|----------------
abc-123  | search-docs    | context7  | 1.0.0   | active | 2025-09-10 12:00
def-456  | create-page    | notion    | 1.2.0   | active | 2025-09-10 11:45
```

**Output Format** (JSON):
```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123",
      "name": "search-docs",
      "toolId": "context7",
      "version": "1.0.0",
      "isActive": true,
      "lastValidated": "2025-09-10T12:00:00Z",
      "performance": {
        "avgResponseTime": 45,
        "successRate": 0.98
      }
    }
  ],
  "total": 1
}
```

### 3. Use Fixed Interface

**Command**: `mcp-tool fixed use <interface-name> [parameters] [options]`

**Purpose**: Execute a registered fixed interface

**Parameters**:
- `interface-name` (required): Name of registered fixed interface
- `parameters` (optional): JSON string of parameters for the interface
- `--tool <tool-id>` (optional): Specify tool if interface name ambiguous
- `--format <json|table|raw>` (default: json): Output format
- `--timeout <seconds>` (default: 30): Request timeout

**Parameter Input**:
- Via command line: `--params '{"query": "search term", "limit": 10}'`
- Via stdin: `echo '{"query": "test"}' | mcp-tool fixed use search-docs`
- Interactive: Prompt for required parameters if not provided

**Output Format** (JSON):
```json
{
  "success": true,
  "data": {
    "result": {
      // MCP tool response data
    },
    "metadata": {
      "interfaceId": "abc-123",
      "responseTime": 42,
      "timestamp": "2025-09-10T12:00:00Z"
    }
  }
}
```

**Error Cases**:
- Interface not found → 404 error
- Invalid parameters → 422 error with validation details
- Authentication required → 401 error with OAuth flow instructions
- MCP server error → 502 error with upstream details

### 4. Test Fixed Interface

**Command**: `mcp-tool fixed test <interface-name> [options]`

**Purpose**: Validate fixed interface against live MCP server

**Parameters**:
- `interface-name` (required): Name of interface to test
- `--tool <tool-id>` (optional): Specify tool if name ambiguous  
- `--update-spec` (flag): Update interface spec if changes detected
- `--verbose` (flag): Show detailed validation results

**Validation Process**:
1. Connect to MCP server
2. Retrieve current tool schema
3. Compare with stored fixed interface spec
4. Test with sample parameters
5. Validate response format

**Output Format** (JSON):
```json
{
  "success": true,
  "data": {
    "interfaceId": "abc-123",
    "toolId": "context7", 
    "validationResults": {
      "schemaMatch": true,
      "responseFormatMatch": true,
      "testCallSuccess": true,
      "responseTime": 38
    },
    "changes": [],
    "recommendations": []
  }
}
```

**Validation Results**:
- `schemaMatch`: Whether parameter schema matches server
- `responseFormatMatch`: Whether response format unchanged
- `testCallSuccess`: Whether test call completed successfully
- `changes`: Array of detected differences
- `recommendations`: Suggested actions (update, deprecate, etc.)

### 5. OAuth Authentication Flow

**Command**: `mcp-tool fixed auth <tool-id> [options]`

**Purpose**: Complete OAuth authentication for MCP servers requiring it

**Parameters**:
- `tool-id` (required): Tool requiring OAuth authentication
- `--reauth` (flag): Force re-authentication even if valid tokens exist
- `--scopes <scopes>` (optional): Comma-separated list of OAuth scopes
- `--browser` (flag): Open browser automatically (default: true)
- `--callback-port <port>` (default: 3000): Local callback server port

**OAuth Flow Process**:
1. Check for existing valid tokens
2. Generate OAuth authorization URL with PKCE
3. Start local callback server
4. Open browser to authorization URL
5. Handle authorization callback
6. Exchange authorization code for tokens
7. Store encrypted tokens securely

**Output Format** (JSON):
```json
{
  "success": true,
  "data": {
    "toolId": "notion",
    "tokenAcquired": true,
    "scopes": ["read", "write"],
    "expiresAt": "2025-09-10T14:00:00Z"
  }
}
```

### 6. Performance Analytics

**Command**: `mcp-tool fixed stats [interface-name] [options]`

**Purpose**: Display performance analytics for fixed interfaces

**Parameters**:
- `interface-name` (optional): Filter by specific interface
- `--tool <tool-id>` (optional): Filter by tool
- `--days <n>` (default: 7): Number of days of data
- `--format <json|table|csv>` (default: table): Output format
- `--compare-dynamic` (flag): Include dynamic access comparison

**Analytics Output**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCalls": 1250,
      "avgResponseTime": 47,
      "successRate": 0.984,
      "performanceImprovement": 0.73
    },
    "interfaces": [
      {
        "name": "search-docs",
        "calls": 450,
        "avgResponseTime": 42,
        "successRate": 0.987,
        "improvementVsDynamic": 0.68
      }
    ],
    "trends": {
      "dailyStats": [
        {
          "date": "2025-09-09",
          "calls": 180,
          "avgResponseTime": 45
        }
      ]
    }
  }
}
```

## Error Handling

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "INTERFACE_NOT_FOUND",
    "message": "Fixed interface 'search-docs' not found",
    "details": {
      "interfaceName": "search-docs",
      "availableInterfaces": ["create-page", "list-pages"]
    }
  }
}
```

### Error Codes
- `TOOL_NOT_FOUND`: Specified tool does not exist
- `INTERFACE_NOT_FOUND`: Fixed interface not found
- `INTERFACE_CONFLICT`: Interface name already exists
- `VALIDATION_FAILED`: Interface validation failed
- `AUTH_REQUIRED`: OAuth authentication needed
- `AUTH_EXPIRED`: OAuth tokens expired
- `MCP_SERVER_ERROR`: Upstream MCP server error
- `INVALID_PARAMETERS`: Parameter validation failed

## Exit Codes

- `0`: Success
- `1`: General error
- `2`: Authentication error  
- `3`: Validation error
- `4`: Network/connection error
- `5`: Configuration error

## Configuration Integration

Fixed interface commands read configuration from existing `mcp-tool` config system:
- Tool connection settings
- Authentication credentials  
- Performance thresholds
- Default output formats

---

**Status**: Complete ✓  
**Implementation**: Contract tests must be written before implementation