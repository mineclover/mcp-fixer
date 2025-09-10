# CLI Contract Specification

**Date**: 2025-09-09  
**Purpose**: Define command-line interface for MCP Tool Management & Query System

## Base Command Structure

```bash
mcp-tool [global-options] <command> [command-options] [arguments]
```

### Global Options
- `--config, -c <path>`: Path to configuration file
- `--database, -d <path>`: Path to SQLite database file
- `--format, -f <format>`: Output format (json|table|csv)
- `--verbose, -v`: Enable verbose output
- `--quiet, -q`: Suppress non-error output
- `--help, -h`: Show help information
- `--version`: Show version information

## Discovery Commands

### `mcp-tool discover [options] [endpoint]`
Discover available MCP tools and analyze their capabilities.

**Purpose**: Implements FR-001 (discover available MCP tools)

**Options**:
- `--scan-local`: Scan local MCP servers
- `--scan-network`: Scan network endpoints
- `--endpoint <url>`: Specific endpoint to discover
- `--timeout <seconds>`: Discovery timeout (default: 30)
- `--save`: Save discovered tools to database

**Arguments**:
- `endpoint`: Optional MCP server endpoint

**Output**:
```json
{
  "discovered": [
    {
      "id": "uuid",
      "name": "tool-name",
      "version": "1.0.0",
      "endpoint": "http://localhost:3000",
      "capabilities": ["list_files", "read_file"],
      "auth_required": true,
      "status": "active"
    }
  ],
  "errors": [
    {
      "endpoint": "http://localhost:3001",
      "error": "Connection refused"
    }
  ]
}
```

**Exit Codes**:
- `0`: Success
- `1`: Discovery failed
- `2`: Invalid arguments

### `mcp-tool tools [options]`
List and manage discovered tools.

**Purpose**: Tool management interface

**Options**:
- `--list`: List all tools (default)
- `--status <status>`: Filter by status (active|inactive|deprecated)
- `--refresh`: Refresh tool capabilities
- `--remove <tool-id>`: Remove tool from database

**Output**:
```json
{
  "tools": [
    {
      "id": "uuid",
      "name": "filesystem",
      "version": "1.2.0",
      "status": "active",
      "last_checked": "2025-09-09T10:00:00Z",
      "capabilities_count": 5
    }
  ]
}
```

## Authentication Commands

### `mcp-tool auth [options] <tool-id>`
Manage authentication credentials for MCP tools.

**Purpose**: Implements FR-005 (handle MCP authentication flows)

**Options**:
- `--set-api-key <key>`: Set API key authentication
- `--set-bearer <token>`: Set Bearer token authentication
- `--set-basic <user:pass>`: Set basic authentication
- `--remove`: Remove stored credentials
- `--test`: Test authentication with tool
- `--expires <date>`: Set credential expiration

**Arguments**:
- `tool-id`: Tool identifier

**Output**:
```json
{
  "tool_id": "uuid",
  "auth_type": "api_key",
  "status": "active",
  "expires_at": "2025-12-09T00:00:00Z",
  "test_result": "success"
}
```

**Exit Codes**:
- `0`: Success
- `1`: Authentication failed
- `2`: Invalid credentials
- `3`: Tool not found

## Query Management Commands

### `mcp-tool query create [options] <name>`
Create a new reusable query from MCP tool operations.

**Purpose**: Implements FR-002 (create reusable queries)

**Options**:
- `--tool <tool-id>`: Target tool identifier
- `--operation <operation>`: MCP operation to capture
- `--parameters <schema>`: Parameter schema (JSON)
- `--description <text>`: Query description
- `--interactive`: Interactive parameter setup

**Arguments**:
- `name`: Query name

**Output**:
```json
{
  "id": "uuid",
  "name": "list-project-files",
  "tool_id": "filesystem-tool",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {"type": "string"},
      "recursive": {"type": "boolean"}
    }
  },
  "status": "created"
}
```

### `mcp-tool query list [options]`
List saved queries.

**Options**:
- `--tool <tool-id>`: Filter by tool
- `--search <term>`: Search by name or description
- `--recent <count>`: Show most recently used queries

**Output**:
```json
{
  "queries": [
    {
      "id": "uuid",
      "name": "list-project-files",
      "tool_name": "filesystem",
      "execution_count": 15,
      "last_executed": "2025-09-09T09:30:00Z"
    }
  ]
}
```

### `mcp-tool query run [options] <query-name>`
Execute a saved query with parameters.

**Purpose**: Implements FR-003 (CLI interface for executing queries)

**Options**:
- `--params <json>`: Query parameters as JSON
- `--param <key=value>`: Individual parameter
- `--collector <name>`: Use data collector for parameters
- `--output <file>`: Save output to file
- `--timeout <seconds>`: Execution timeout

**Arguments**:
- `query-name`: Name of query to execute

**Output**:
```json
{
  "query_id": "uuid",
  "execution_id": "uuid",
  "status": "completed",
  "result": {
    "files": [
      {"name": "src/main.ts", "type": "file"},
      {"name": "tests/", "type": "directory"}
    ]
  },
  "execution_time": 1.23
}
```

**Exit Codes**:
- `0`: Success
- `1`: Execution failed
- `2`: Query not found
- `3`: Parameter validation failed
- `4`: Authentication failed

## Data Collector Commands

### `mcp-tool collector register [options] <path>`
Register a custom data collector.

**Purpose**: Implements FR-004 (support custom data collectors)

**Options**:
- `--name <name>`: Collector name
- `--description <text>`: Collector description
- `--timeout <seconds>`: Execution timeout
- `--test`: Test collector after registration

**Arguments**:
- `path`: Path to collector module

**Output**:
```json
{
  "id": "uuid",
  "name": "git-collector",
  "file_path": "/path/to/collector.js",
  "input_schema": {...},
  "output_schema": {...},
  "status": "registered"
}
```

### `mcp-tool collector list [options]`
List registered data collectors.

**Options**:
- `--enabled`: Show only enabled collectors
- `--test-all`: Test all collectors

**Output**:
```json
{
  "collectors": [
    {
      "id": "uuid",
      "name": "git-collector",
      "enabled": true,
      "execution_count": 5,
      "last_executed": "2025-09-09T08:00:00Z"
    }
  ]
}
```

### `mcp-tool collector run [options] <name>`
Execute a data collector.

**Options**:
- `--input <json>`: Input parameters
- `--output <file>`: Save output to file

**Arguments**:
- `name`: Collector name

**Output**:
```json
{
  "collector_id": "uuid",
  "execution_time": 0.85,
  "output": {
    "branch": "main",
    "commit": "abc123",
    "modified_files": 3
  }
}
```

## System Commands

### `mcp-tool init [options] [path]`
Initialize MCP tool database and configuration.

**Options**:
- `--config-file <path>`: Create configuration file
- `--database-path <path>`: Database location
- `--force`: Overwrite existing database

**Arguments**:
- `path`: Optional installation directory

### `mcp-tool status [options]`
Show system status and health information.

**Options**:
- `--database`: Show database status
- `--tools`: Show tool connection status
- `--credentials`: Show credential status (no secrets)

**Output**:
```json
{
  "database": {
    "path": "/home/user/.mcp-tool/database.sqlite",
    "size": "2.3MB",
    "tools_count": 5,
    "queries_count": 23
  },
  "tools": {
    "active": 4,
    "inactive": 1,
    "authentication_errors": 0
  },
  "credentials": {
    "stored": 4,
    "expired": 0,
    "expiring_soon": 1
  }
}
```

## Error Handling

### Standard Error Format
```json
{
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Tool with ID 'uuid' not found",
    "details": {
      "tool_id": "uuid",
      "available_tools": ["tool1", "tool2"]
    }
  }
}
```

### Error Codes
- `TOOL_NOT_FOUND`: Tool identifier not found
- `QUERY_NOT_FOUND`: Query name not found
- `COLLECTOR_NOT_FOUND`: Data collector not found
- `AUTH_FAILED`: Authentication failure
- `VALIDATION_ERROR`: Parameter validation failed
- `EXECUTION_TIMEOUT`: Operation timeout
- `DATABASE_ERROR`: Database operation failed
- `NETWORK_ERROR`: Network connectivity issue

## Configuration File Schema

### Location: `~/.mcp-tool/config.json`

```json
{
  "database": {
    "path": "~/.mcp-tool/database.sqlite",
    "max_connections": 10,
    "timeout": 30000
  },
  "security": {
    "encryption_enabled": true,
    "key_derivation_rounds": 100000,
    "credential_ttl": 2592000
  },
  "discovery": {
    "cache_timeout": 3600,
    "max_concurrency": 5,
    "retry_attempts": 3
  },
  "performance": {
    "query_timeout": 30,
    "max_memory_usage": 536870912,
    "enable_streaming": true
  },
  "logging": {
    "level": "info",
    "file": "~/.mcp-tool/logs/app.log",
    "max_size": 10485760,
    "max_files": 5
  }
}
```

## Environment Variables

- `MCP_TOOL_CONFIG`: Path to configuration file
- `MCP_TOOL_DATABASE`: Path to database file
- `MCP_TOOL_LOG_LEVEL`: Logging level (debug|info|warn|error)
- `MCP_TOOL_NO_COLOR`: Disable colored output
- `MCP_TOOL_API_TIMEOUT`: Default API timeout in seconds

## Output Formats

### JSON Format (default)
Structured data suitable for programmatic consumption.

### Table Format
Human-readable tabular output for terminal display.

### CSV Format
Comma-separated values for data analysis and reporting.

---

**Next**: Generate MCP integration contracts and database contracts