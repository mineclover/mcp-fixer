# Quickstart Guide: MCP Tool Management & Query System

**Date**: 2025-09-09  
**Purpose**: Step-by-step user guide from tool discovery to query execution

## Prerequisites

- Bun runtime installed
- Access to one or more MCP tools/servers
- Basic understanding of command-line interfaces

## Installation

```bash
# Install the MCP tool manager
npm install -g mcp-tool

# Initialize the system
mcp-tool init

# Verify installation
mcp-tool --version
mcp-tool --help
```

## Quick Start Workflow

### Step 1: Discover MCP Tools

Discover available MCP tools in your environment:

```bash
# Scan for local MCP servers
mcp-tool discover --scan-local

# Discover specific endpoint
mcp-tool discover http://localhost:3000

# Save discovered tools to database
mcp-tool discover --scan-local --save
```

**Expected Output**:
```json
{
  "discovered": [
    {
      "id": "fs-tool-uuid",
      "name": "filesystem",
      "version": "1.2.0",
      "endpoint": "http://localhost:3000",
      "capabilities": ["list_files", "read_file", "write_file"],
      "auth_required": false,
      "status": "active"
    }
  ]
}
```

### Step 2: List Available Tools

View your discovered tools:

```bash
# List all tools
mcp-tool tools --list

# Filter by status
mcp-tool tools --status active
```

**Expected Output**:
```json
{
  "tools": [
    {
      "id": "fs-tool-uuid",
      "name": "filesystem",
      "version": "1.2.0",
      "status": "active",
      "last_checked": "2025-09-09T10:00:00Z",
      "capabilities_count": 3
    }
  ]
}
```

### Step 3: Configure Authentication (if required)

Set up authentication for tools that require it:

```bash
# Set API key authentication
mcp-tool auth fs-tool-uuid --set-api-key "your-api-key"

# Set Bearer token
mcp-tool auth fs-tool-uuid --set-bearer "your-bearer-token"

# Test authentication
mcp-tool auth fs-tool-uuid --test
```

**Expected Output**:
```json
{
  "tool_id": "fs-tool-uuid",
  "auth_type": "api_key",
  "status": "active",
  "test_result": "success"
}
```

### Step 4: Create Your First Query

Create a reusable query template:

```bash
# Interactive query creation
mcp-tool query create "list-project-files" \
  --tool fs-tool-uuid \
  --operation list_files \
  --interactive

# Or specify parameters directly
mcp-tool query create "list-project-files" \
  --tool fs-tool-uuid \
  --operation list_files \
  --parameters '{"type":"object","properties":{"path":{"type":"string"},"recursive":{"type":"boolean","default":true}}}' \
  --description "List all files in a project directory"
```

**Expected Output**:
```json
{
  "id": "query-uuid",
  "name": "list-project-files",
  "tool_id": "fs-tool-uuid",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {"type": "string"},
      "recursive": {"type": "boolean", "default": true}
    }
  },
  "status": "created"
}
```

### Step 5: Execute Your Query

Run the query with parameters:

```bash
# Execute with parameters
mcp-tool query run "list-project-files" \
  --param path="/home/user/project" \
  --param recursive=true

# Or using JSON parameters
mcp-tool query run "list-project-files" \
  --params '{"path":"/home/user/project","recursive":true}'
```

**Expected Output**:
```json
{
  "query_id": "query-uuid",
  "execution_id": "exec-uuid",
  "status": "completed",
  "result": {
    "files": [
      {"name": "src/main.ts", "type": "file", "size": 1024},
      {"name": "tests/", "type": "directory"},
      {"name": "package.json", "type": "file", "size": 512}
    ]
  },
  "execution_time": 0.85
}
```

## Advanced Features

### Data Collectors

Create and use custom data collectors:

```bash
# Register a Git information collector
mcp-tool collector register ./collectors/git-info.js \
  --name "git-info" \
  --description "Collects Git repository information"

# Use collector with query
mcp-tool query run "repository-analysis" \
  --collector git-info \
  --param repository_path="/home/user/project"
```

### Query Management

Manage your query library:

```bash
# List all queries
mcp-tool query list

# Search queries
mcp-tool query list --search "files"

# Show recent queries
mcp-tool query list --recent 5

# Export query for sharing
mcp-tool query export "list-project-files" > my-query.json

# Import shared query
mcp-tool query import < shared-query.json
```

### System Monitoring

Monitor system health and performance:

```bash
# Check system status
mcp-tool status

# Database information
mcp-tool status --database

# Tool connection status
mcp-tool status --tools

# Credential status (no secrets shown)
mcp-tool status --credentials
```

## Common Use Cases

### 1. File System Operations

```bash
# Create file listing query
mcp-tool query create "list-source-files" \
  --tool filesystem-tool \
  --operation list_files \
  --params '{"properties":{"path":{"type":"string"},"pattern":{"type":"string","default":"*.ts"}}}'

# Execute with pattern filtering
mcp-tool query run "list-source-files" \
  --param path="./src" \
  --param pattern="*.ts"
```

### 2. API Data Retrieval

```bash
# Discover API tool
mcp-tool discover https://api.example.com/mcp

# Set authentication
mcp-tool auth api-tool-uuid --set-bearer "your-api-token"

# Create data query
mcp-tool query create "fetch-user-data" \
  --tool api-tool-uuid \
  --operation get_user \
  --params '{"properties":{"user_id":{"type":"string"}}}'

# Execute query
mcp-tool query run "fetch-user-data" --param user_id="12345"
```

### 3. Data Processing Pipeline

```bash
# Register data transformer
mcp-tool collector register ./collectors/json-transformer.js \
  --name "json-transform"

# Create processing query
mcp-tool query create "process-data" \
  --tool data-processor-tool \
  --operation transform

# Execute with collector
mcp-tool query run "process-data" \
  --collector json-transform \
  --param input_file="data.json"
```

## Configuration

### Configuration File Location
`~/.mcp-tool/config.json`

### Key Configuration Options

```json
{
  "database": {
    "path": "~/.mcp-tool/database.sqlite"
  },
  "security": {
    "encryption_enabled": true,
    "credential_ttl": 2592000
  },
  "performance": {
    "query_timeout": 30,
    "max_memory_usage": 536870912
  },
  "discovery": {
    "cache_timeout": 3600,
    "retry_attempts": 3
  }
}
```

### Environment Variables

```bash
# Set configuration file location
export MCP_TOOL_CONFIG="/path/to/config.json"

# Set database location
export MCP_TOOL_DATABASE="/path/to/database.sqlite"

# Set log level
export MCP_TOOL_LOG_LEVEL="debug"
```

## Troubleshooting

### Common Issues

**Tool Discovery Fails**:
```bash
# Check network connectivity
mcp-tool discover http://localhost:3000 --timeout 60

# Check tool status
mcp-tool tools --status inactive
```

**Authentication Problems**:
```bash
# Test credentials
mcp-tool auth tool-uuid --test

# Re-authenticate
mcp-tool auth tool-uuid --set-api-key "new-key"
```

**Query Execution Errors**:
```bash
# Check query parameters
mcp-tool query run query-name --params '{}' --verbose

# Validate query compatibility
mcp-tool query validate query-name
```

**Performance Issues**:
```bash
# Check system status
mcp-tool status --verbose

# Monitor execution
mcp-tool query run query-name --timeout 60 --verbose
```

### Debug Mode

Enable detailed logging:

```bash
# Enable debug output
export MCP_TOOL_LOG_LEVEL="debug"

# Run with verbose output
mcp-tool query run query-name --verbose

# Check logs
tail -f ~/.mcp-tool/logs/app.log
```

## Best Practices

### Query Design
1. Use descriptive query names
2. Include parameter validation in schemas
3. Set appropriate timeout values
4. Document query purposes in descriptions

### Security
1. Regularly rotate authentication credentials
2. Use credential expiration where possible
3. Monitor credential usage
4. Avoid storing credentials in environment variables

### Performance
1. Cache frequently used queries
2. Use streaming for large data sets
3. Monitor execution times
4. Set appropriate timeout values

### Maintenance
1. Regularly update tool capabilities
2. Clean up unused queries
3. Monitor disk space usage
4. Review audit logs periodically

## Next Steps

After completing this quickstart:

1. **Explore Advanced Features**: Data collectors, query chaining, batch operations
2. **Integration**: Integrate with CI/CD pipelines, automation scripts
3. **Custom Development**: Create custom data collectors for your specific needs
4. **Community**: Share queries and collectors with the community

## Getting Help

- **Documentation**: `mcp-tool --help` and `mcp-tool <command> --help`
- **System Status**: `mcp-tool status --verbose`
- **Debug Logs**: `~/.mcp-tool/logs/app.log`
- **Configuration**: `~/.mcp-tool/config.json`

---

**Success Criteria**: 
- ✅ Discover at least one MCP tool
- ✅ Create and execute a query successfully  
- ✅ Understand configuration and troubleshooting basics