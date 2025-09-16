# MCP Tool Usage Guide

Comprehensive usage guide for the MCP Tool Management & Query System with Fixed Interface Optimization.

## 📋 Table of Contents

- [Command Reference](#command-reference)
- [Usage Patterns](#usage-patterns)
- [Performance Optimization](#performance-optimization)
- [OAuth Authentication](#oauth-authentication)
- [Troubleshooting](#troubleshooting)
- [Advanced Workflows](#advanced-workflows)

## 🚀 Command Reference

### System Commands

#### Initialize System
```bash
mcp-tool init [path]
```
Options:
- `--database <path>` - Custom database location
- `--config <path>` - Custom configuration file
- `--skip-examples` - Skip example data creation
- `--force` - Overwrite existing configuration

#### System Status
```bash
mcp-tool status [options]
```
Options:
- `--health-check` - Run comprehensive health checks
- `--show-config` - Display configuration details
- `--show-metrics` - Show performance metrics
- `--format <format>` - Output format (json|table|csv)

#### Backup System
```bash
mcp-tool backup [path] [options]
```
Options:
- `--compress` - Create compressed backup
- `--exclude-cache` - Exclude cache data
- `--include-config` - Include configuration files

### Tool Discovery

#### Discover MCP Tools
```bash
mcp-tool discover [endpoint] [options]
```
Options:
- `--timeout <ms>` - Connection timeout (default: 10000)
- `--save` - Save discovered tools to database
- `--validate` - Validate tool operations
- `--format <format>` - Output format

Examples:
```bash
# Discover Notion MCP server
mcp-tool discover notion://localhost:3000 --save --validate

# Discover Context7 server
mcp-tool discover context7://localhost:3001 --timeout 15000

# Discover with custom headers
mcp-tool discover api://localhost:8080 --headers '{"Authorization": "Bearer token"}'
```

#### List Discovered Tools
```bash
mcp-tool tools [options]
```
Options:
- `--filter <pattern>` - Filter tools by name pattern
- `--show-operations` - Show available operations
- `--show-auth` - Show authentication status
- `--format <format>` - Output format

### Fixed Interface Management

#### Register Fixed Interface
```bash
mcp-tool fixed register <tool-id> <operation-name> [options]
```
Options:
- `--name <name>` - Display name for interface
- `--description <desc>` - Interface description
- `--version <version>` - Interface version (default: 1.0.0)
- `--parameters <json>` - Parameters JSON schema
- `--response-schema <json>` - Response JSON schema
- `--auto-discover` - Auto-discover schema from MCP tool
- `--validate-operation` - Validate operation exists
- `--force` - Overwrite existing interface
- `--dry-run` - Preview without saving

Examples:
```bash
# Auto-discover and register
mcp-tool fixed register notion-mcp search_pages \
  --name "Notion Search" \
  --auto-discover \
  --validate-operation

# Register with custom schema
mcp-tool fixed register api-tool search \
  --name "API Search" \
  --parameters '{"type":"object","properties":{"query":{"type":"string"}}}' \
  --response-schema '{"type":"object","properties":{"results":{"type":"array"}}}'

# Dry run to preview
mcp-tool fixed register github-mcp search_repos \
  --name "GitHub Search" \
  --dry-run \
  --auto-discover
```

#### List Fixed Interfaces
```bash
mcp-tool fixed list [tool-id] [options]
```
Options:
- `--show-schema` - Show parameter and response schemas
- `--show-stats` - Show usage statistics
- `--filter <pattern>` - Filter by name pattern
- `--sort <field>` - Sort by field (name|created|used)
- `--format <format>` - Output format

#### Execute Fixed Interface
```bash
mcp-tool fixed use <interface-name> [parameters] [options]
```
Options:
- `--params-file <path>` - Load parameters from file
- `--timeout <ms>` - Execution timeout
- `--retry <count>` - Retry attempts on failure
- `--cache` - Use cached response if available
- `--no-cache` - Force fresh execution
- `--format <format>` - Output format

Examples:
```bash
# Direct parameter execution
mcp-tool fixed use search_pages '{"query": "project", "limit": 10}'

# Load parameters from file
mcp-tool fixed use search_pages --params-file ./queries/notion-search.json

# Execute with custom timeout
mcp-tool fixed use api_search '{"q": "documentation"}' --timeout 30000 --retry 3

# Use cached response
mcp-tool fixed use expensive_operation '{"data": "large"}' --cache
```

#### Test Fixed Interface
```bash
mcp-tool fixed test [interface-name] [options]
```
Options:
- `--benchmark` - Run performance benchmarks
- `--compare-performance` - Compare with dynamic discovery
- `--target-response-time <ms>` - Target response time
- `--iterations <count>` - Number of test iterations
- `--parallel <count>` - Parallel test workers
- `--comprehensive` - Run all validation tests
- `--junit-output` - Generate JUnit XML report

Examples:
```bash
# Quick validation test
mcp-tool fixed test search_pages

# Performance benchmark
mcp-tool fixed test search_pages \
  --benchmark \
  --iterations 100 \
  --target-response-time 100ms

# Comprehensive testing
mcp-tool fixed test --comprehensive --parallel 5 --junit-output
```

#### Performance Statistics
```bash
mcp-tool fixed stats [interface-name] [options]
```
Options:
- `--detailed` - Show detailed metrics
- `--compare` - Compare with dynamic discovery
- `--trend` - Show trend analysis
- `--baseline` - Set performance baseline
- `--compare-baseline <file>` - Compare with baseline
- `--export-csv <file>` - Export to CSV
- `--export-json <file>` - Export to JSON
- `--generate-report <file>` - Generate HTML report

### OAuth Authentication

#### Setup OAuth Provider
```bash
mcp-tool fixed auth <tool-id> [options]
```
Options:
- `--setup-provider <provider>` - Setup OAuth provider
- `--client-id <id>` - OAuth client ID
- `--client-secret <secret>` - OAuth client secret
- `--redirect-uri <uri>` - OAuth redirect URI
- `--scope <scopes>` - OAuth scopes
- `--enable-pkce` - Enable PKCE flow
- `--login` - Start OAuth login flow
- `--callback` - Handle OAuth callback
- `--refresh` - Refresh access token
- `--status` - Show authentication status

Examples:
```bash
# Setup Notion OAuth
mcp-tool fixed auth notion-mcp \
  --setup-provider notion \
  --client-id $NOTION_CLIENT_ID \
  --enable-pkce \
  --scope "read"

# Start login flow
mcp-tool fixed auth notion-mcp --login

# Handle callback (after browser auth)
mcp-tool fixed auth notion-mcp \
  --callback \
  --code $AUTH_CODE \
  --state $STATE_VALUE

# Check auth status
mcp-tool fixed auth --status --format table
```

## 🔄 Usage Patterns

### 1. Development Workflow
```bash
# 1. Initialize and discover
mcp-tool init
mcp-tool discover notion://localhost:3000 --save
mcp-tool tools --format table

# 2. Register and test interfaces
mcp-tool fixed register notion-mcp search_pages --auto-discover
mcp-tool fixed test search_pages --benchmark

# 3. Execute and monitor
mcp-tool fixed use search_pages '{"query": "docs", "limit": 5}'
mcp-tool fixed stats search_pages --detailed
```

### 2. Production Deployment
```bash
# 1. Validate all interfaces
mcp-tool fixed test --comprehensive --parallel

# 2. Set performance baseline
mcp-tool fixed stats --all --baseline --export baseline.json

# 3. Backup before changes
mcp-tool backup ./backups/pre-deploy-$(date +%Y%m%d).db

# 4. Monitor post-deployment
mcp-tool fixed stats --all --compare-baseline baseline.json
```

### 3. Continuous Integration
```bash
#!/bin/bash
# CI Pipeline Script

set -e

# Initialize test environment
mcp-tool init --force

# Register test interfaces
mcp-tool fixed register test-api search --auto-discover --validate-operation

# Run comprehensive tests
mcp-tool fixed test --comprehensive --junit-output --parallel 3

# Performance regression testing
mcp-tool fixed stats --all --compare-baseline ci/baseline.json --threshold 10%

# Cleanup
rm -rf test-data/
```

## ⚡ Performance Optimization

### Caching Strategy
```bash
# Enable aggressive caching
export MCP_TOOL_CACHE_TIMEOUT=7200  # 2 hours

# Use cached responses
mcp-tool fixed use expensive_query '{"data": "large"}' --cache

# Clear cache when needed
mcp-tool config --clear-cache
```

### Batch Operations
```bash
# Batch interface registration
for tool in notion-mcp github-mcp slack-mcp; do
  mcp-tool fixed register $tool search --auto-discover
done

# Parallel testing
mcp-tool fixed test --comprehensive --parallel 8
```

### Performance Monitoring
```bash
# Continuous monitoring
mcp-tool fixed test search_pages \
  --continuous \
  --interval 300 \
  --alert-threshold 200ms \
  --log-file performance.log

# Daily performance reports
mcp-tool fixed stats --all \
  --detailed \
  --trend \
  --generate-report daily-$(date +%Y%m%d).html
```

## 🔐 OAuth Authentication

### Supported Providers
- **Notion**: PKCE-enabled OAuth 2.0
- **GitHub**: Standard OAuth 2.0
- **Slack**: OAuth 2.0 with custom scopes
- **Custom**: Generic OAuth 2.0 provider

### Manual Intervention Detection
```bash
# System automatically detects when manual intervention is needed
mcp-tool fixed auth notion-mcp --login

# Output:
# MANUAL INTERVENTION NEEDED: OAuth flow requires browser authentication
# 1. Open the authorization URL in your browser
# 2. Complete the authentication process
# 3. Copy the authorization code from callback URL
# 4. Run: mcp-tool fixed auth --callback --code <code> --state <state>
```

### Token Management
```bash
# Check token status
mcp-tool fixed auth --status

# Refresh tokens
mcp-tool fixed auth notion-mcp --refresh

# Revoke tokens
mcp-tool fixed auth notion-mcp --revoke
```

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check connectivity
mcp-tool discover localhost:3000 --timeout 5000

# Validate tool status
mcp-tool tools --show-auth --format table

# Test with verbose output
mcp-tool -v fixed use interface_name '{}'
```

#### Performance Issues
```bash
# Clear cache
mcp-tool config --clear-cache

# Check database health
mcp-tool status --health-check

# Analyze slow queries
mcp-tool fixed stats --detailed --format json | jq '.slow_queries'
```

#### Authentication Failures
```bash
# Check auth status
mcp-tool fixed auth --status

# Re-authenticate
mcp-tool fixed auth tool-id --login

# Debug OAuth flow
mcp-tool -v fixed auth tool-id --login --debug
```

### Debug Commands
```bash
# Verbose output
mcp-tool -v command [options]

# Configuration debugging
mcp-tool config --show --format json

# Database debugging
sqlite3 dev.db ".schema" | head -20
sqlite3 dev.db "SELECT * FROM fixed_interfaces LIMIT 5;"
```

## 🚀 Advanced Workflows

### Custom Integration Scripts
```bash
#!/bin/bash
# Advanced workflow example

# Multi-service search
declare -A services=(
  ["notion"]="search_pages"
  ["github"]="search_repos"
  ["confluence"]="search_spaces"
)

query="API documentation"

for service in "${!services[@]}"; do
  interface="${services[$service]}"
  echo "Searching $service..."

  mcp-tool fixed use "$interface" \
    "{\"query\": \"$query\", \"limit\": 10}" \
    --format json \
    --cache > "results/${service}_results.json"
done

# Aggregate results
jq -s 'add' results/*.json > aggregated_results.json
```

### Performance Analysis
```bash
#!/bin/bash
# Performance analysis script

interfaces=($(mcp-tool fixed list --format json | jq -r '.[].name'))

for interface in "${interfaces[@]}"; do
  echo "Analyzing $interface..."

  mcp-tool fixed test "$interface" \
    --benchmark \
    --iterations 50 \
    --target-response-time 100ms

  mcp-tool fixed stats "$interface" \
    --detailed \
    --export-csv "metrics/${interface}_metrics.csv"
done

# Generate comparison report
mcp-tool fixed stats --all \
  --compare \
  --generate-report comparison_report.html
```

---

For more examples and advanced configurations, see the [examples/](examples/) directory and [documentation](docs/).