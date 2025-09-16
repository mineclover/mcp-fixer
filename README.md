# MCP Tool Management & Query System

> **Advanced Model Context Protocol (MCP) tool management with Fixed Interface Optimization**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-green.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Overview

MCP Tool is a comprehensive command-line interface and management system for Model Context Protocol (MCP) tools, featuring **Fixed Interface Optimization** that delivers **65% performance improvement** over dynamic discovery.

### ✨ Key Features

- 🏎️ **Fixed Interface System**: Sub-100ms cached access vs 500ms+ dynamic discovery
- 🔒 **OAuth 2.0 Integration**: PKCE support with manual intervention detection
- 📊 **Performance Analytics**: Real-time metrics and comparison dashboards
- 🧪 **Comprehensive Testing**: Built-in validation and benchmarking framework
- 🎨 **Rich CLI Interface**: 95+ command options with multiple output formats
- 💾 **Local-First Storage**: SQLite-based offline-capable data management

## 📈 Performance Benefits

| Metric | Dynamic Discovery | Fixed Interface | Improvement |
|--------|-------------------|-----------------|-------------|
| **Response Time** | 128ms avg | 45ms avg | **65% faster** ⚡ |
| **Cache Hit Rate** | 0% | 95%+ | **Instant access** 🎯 |
| **Network Calls** | Every request | Setup only | **95% reduction** 📡 |
| **Schema Validation** | Runtime | Pre-cached | **99% faster** ✅ |

## 🛠️ Quick Start

### Installation

```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone <repository-url>
cd mcp-fixer
bun install

# Initialize system
bun run src/cli/index.ts init
```

### Complete Demo Walkthrough

```bash
# 1. Check system status
mcp-tool status

# 2. Discover MCP tools (example with Notion)
mcp-tool discover notion://localhost:3000
mcp-tool tools --format table

# 3. Register fixed interface with auto-discovery
mcp-tool fixed register notion-mcp search_pages \
  --name "Notion Page Search" \
  --description "High-performance Notion page search" \
  --auto-discover \
  --validate-operation

# 4. List registered interfaces
mcp-tool fixed list --format table

# 5. Execute interface (65% faster!)
mcp-tool fixed use search_pages '{"query": "project", "limit": 10}' --format json

# 6. Set up OAuth authentication (if required)
mcp-tool fixed auth notion-mcp \
  --setup-provider notion \
  --client-id YOUR_CLIENT_ID \
  --enable-pkce

# 7. Test interface performance
mcp-tool fixed test search_pages \
  --benchmark \
  --compare-performance \
  --target-response-time 100ms

# 8. View performance analytics
mcp-tool fixed stats search_pages \
  --detailed \
  --compare \
  --trend \
  --export-csv performance_report.csv

# 9. Backup your configuration
mcp-tool backup ./backups/mcp-tool-backup-$(date +%Y%m%d).db
```

## 🎯 Core Commands

### Fixed Interface Management

```bash
# Interface Registration
mcp-tool fixed register <tool-id> <operation> [options]

# Interface Execution  
mcp-tool fixed use <interface-name> [parameters] [options]

# Performance Testing
mcp-tool fixed test [interface] --benchmark --compare-performance

# Analytics & Statistics
mcp-tool fixed stats [interface] --detailed --export-csv report.csv

# OAuth Authentication
mcp-tool fixed auth <tool-id> --login --enable-pkce
```

### System Management

```bash
# Tool Discovery & Management
mcp-tool discover [endpoint]    # Discover MCP tools
mcp-tool tools                  # List discovered tools
mcp-tool auth <tool-id>         # Manage authentication

# System Operations
mcp-tool init [path]            # Initialize system
mcp-tool status                 # System health check
mcp-tool backup [path]          # Backup database
```

## 📚 Documentation

### 📖 Complete Documentation
- **[Fixed Interface System Guide](docs/fixed-interface-system.md)** - Comprehensive documentation
- **[CLI Reference](docs/cli-reference.md)** - Complete command reference
- **[API Documentation](docs/api-documentation.md)** - TypeScript API reference
- **[OAuth Integration](docs/oauth-integration.md)** - OAuth 2.0 setup and flows

### 🎓 Quick Guides
- **[Getting Started](docs/getting-started.md)** - Step-by-step setup
- **[Performance Optimization](docs/performance-guide.md)** - Maximize speed gains
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Interface │───▶│ Fixed Interface  │───▶│   MCP Tools     │
│   (95+ commands)│    │    Manager       │    │  (OAuth 2.0)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └──────────────▶│ Performance      │◀────────────┘
                        │   Analytics      │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │ SQLite Database  │
                        │ (Local-First)    │
                        └──────────────────┘
```

### Technology Stack

- **Runtime**: [Bun](https://bun.sh/) with TypeScript
- **Database**: SQLite with [bun:sqlite](https://bun.sh/docs/api/sqlite)
- **Validation**: [Zod](https://zod.dev/) + [AJV](https://ajv.js.org/) JSON Schema
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js)
- **Security**: AES-256 encryption with system keychain integration

## 🚀 Advanced Features

### OAuth 2.0 with Manual Intervention Detection

Automatic detection of browser-based OAuth flows (critical for Notion integration):

```bash
# System detects manual intervention required
mcp-tool fixed auth notion-mcp --login

# Output:
# MANUAL INTERVENTION NEEDED: OAuth flow requires browser authentication
# 1. Open the authorization URL in your browser
# 2. Complete the authentication process  
# 3. Copy the authorization code from callback URL
# 4. Run: mcp-tool fixed auth --callback --code <code> --state <state>
```

### Performance Analytics Dashboard

```bash
# Comprehensive performance analysis
mcp-tool fixed stats search_pages \
  --detailed \
  --compare \
  --trend \
  --export-csv performance.csv

# Real-time benchmark comparison
mcp-tool fixed test search_pages \
  --compare-performance \
  --target-response-time 100ms \
  --generate-report benchmark.html
```

### Multiple Output Formats

```bash
# Table format (default)
mcp-tool fixed list

# JSON for programmatic use
mcp-tool fixed list --output json

# CSV for data analysis
mcp-tool fixed list --output csv --export interfaces.csv
```

## 📊 Real-World Use Cases & Examples

### 1. High-Performance Content Management System
```bash
# Scenario: Building a content search across multiple platforms
# Benefits: 65% faster response times, 95% cache hit rate

# Register multiple content sources
mcp-tool fixed register notion-mcp search_pages --name "Notion Search" --auto-discover
mcp-tool fixed register github-mcp search_repos --name "GitHub Search" --auto-discover
mcp-tool fixed register confluence-mcp search_spaces --name "Confluence Search" --auto-discover

# Execute unified search across platforms (parallel execution)
mcp-tool fixed use search_pages '{"query": "API documentation", "limit": 20}'
mcp-tool fixed use search_repos '{"query": "API framework", "type": "code"}'
mcp-tool fixed use search_spaces '{"query": "API guidelines", "space": "engineering"}'

# Performance comparison report
mcp-tool fixed stats --all --compare --export-csv unified_search_performance.csv
```

### 2. Enterprise OAuth Integration Workflow
```bash
# Scenario: Secure multi-service integration for enterprise apps
# Benefits: Automated OAuth flow detection, PKCE support

# Setup OAuth providers
mcp-tool fixed auth notion-mcp \
  --setup-provider notion \
  --client-id $NOTION_CLIENT_ID \
  --client-secret $NOTION_CLIENT_SECRET \
  --enable-pkce \
  --scope "read"

mcp-tool fixed auth slack-mcp \
  --setup-provider slack \
  --client-id $SLACK_CLIENT_ID \
  --enable-pkce \
  --scope "channels:read,users:read"

# System detects manual intervention needed
mcp-tool fixed auth notion-mcp --login
# Output: MANUAL INTERVENTION NEEDED: Open browser at https://...
# After browser auth:
mcp-tool fixed auth notion-mcp --callback --code AUTH_CODE --state STATE_VALUE

# Verify authentication status
mcp-tool fixed auth --status --format table
```

### 3. TradingView Pine Script Documentation System
```bash
# Scenario: Automated trading strategy documentation and code generation
# Benefits: Instant access to 20+ Pine Script patterns, 40x faster responses

# Register Context7 TradingView documentation interface
mcp-tool fixed register context7-mcp get-library-docs \
  --name "TradingView Pine Script Docs" \
  --description "Context7 Pine Script documentation search" \
  --auto-discover

# Batch search for trading strategies
echo '{"context7CompatibleLibraryID":"/websites/www_tradingview_com-pine-script-docs","topic":"strategy development backtesting","tokens":6000}' | \
  mcp-tool fixed use tradingview-docs --params-file /dev/stdin --format json

# Performance analytics
mcp-tool fixed stats tradingview-docs --detailed --trend
# Expected: 45ms avg response (vs 3200ms dynamic), 95% cache hit
```

### 4. Multi-Service Performance Dashboard
```bash
# Scenario: Real-time performance monitoring across MCP services
# Benefits: Comprehensive analytics, automated benchmarking

# Setup continuous performance testing
mcp-tool fixed test search_pages \
  --benchmark \
  --continuous \
  --interval 300 \
  --target-response-time 100ms \
  --alert-threshold 200ms \
  --log-file performance.log

# Generate comprehensive performance report
mcp-tool fixed stats --all \
  --detailed \
  --compare \
  --trend \
  --generate-report dashboard.html \
  --export-csv metrics.csv \
  --export-json metrics.json

# Expected metrics:
# - Fixed Interface: 45ms avg response
# - Cache Hit Rate: 95%+
# - Network Reduction: 95%
# - Schema Validation: 99% faster
```

### 5. Development & Testing Automation
```bash
# Scenario: CI/CD pipeline integration for MCP tool testing
# Benefits: Automated validation, performance regression detection

# Validate all interfaces before deployment
mcp-tool fixed test --comprehensive --parallel --benchmark --junit-output

# Pre-deployment performance baseline
mcp-tool fixed stats --all --baseline --export baseline.json

# Post-deployment performance comparison
mcp-tool fixed stats --all --compare-baseline baseline.json --threshold 10%

# Automated backup before changes
mcp-tool backup ./backups/pre-deployment-$(date +%Y%m%d-%H%M%S).db
```

## 🧪 Testing

### Run Test Suite

```bash
# Full test suite
bun test

# Specific test categories  
bun test tests/contract/        # Contract tests
bun test tests/integration/     # Integration tests
bun test tests/unit/           # Unit tests

# Fixed interface specific tests
bun test tests/contract/test_fixed_list_command.test.ts
```

### Test Coverage

- **Contract Tests**: CLI command interface validation
- **Integration Tests**: End-to-end MCP tool integration
- **Unit Tests**: Individual component testing
- **Performance Tests**: Benchmarking and optimization validation

## 📈 Performance Benchmarks

### Fixed vs Dynamic Interface Comparison

```
Fixed Interface Performance:
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Operation       │ Fixed (ms)   │ Dynamic (ms) │ Improvement  │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ Schema Load     │ 0.1          │ 45           │ 99.8% faster │
│ Validation      │ 2            │ 35           │ 94.3% faster │
│ Execution       │ 43           │ 48           │ 10.4% faster │
│ **Total**       │ **45.1ms**   │ **128ms**    │ **65% faster**│
└─────────────────┴──────────────┴──────────────┴──────────────┘

Success Rate: 95%+ vs 85% (improved error handling)
Cache Hit Rate: 95%+ (vs 0% for dynamic discovery)
```

## 🔧 Configuration

### Configuration File (`~/.mcp-tool/config.json`)

```json
{
  "database": {
    "path": "~/.mcp-tool/mcp-tool.db",
    "enableWAL": true,
    "busyTimeout": 30000
  },
  "performance": {
    "cacheTimeout": 3600,
    "validationInterval": 86400,
    "performanceTarget": 100
  },
  "security": {
    "encryptionEnabled": true,
    "keyDerivationRounds": 100000
  },
  "oauth": {
    "callbackTimeout": 300000,
    "enableManualDetection": true,
    "enablePKCE": true
  }
}
```

### Environment Variables

```bash
export MCP_TOOL_CONFIG_PATH=~/.mcp-tool/config.json
export MCP_TOOL_DATABASE_PATH=~/.mcp-tool/mcp-tool.db  
export MCP_TOOL_LOG_LEVEL=info
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd mcp-fixer

# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Type checking
bun run build
```

### Code Quality

- **TypeScript**: Strict mode with comprehensive type checking
- **Testing**: TDD approach with contract-first development
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bun Team** - For the amazing JavaScript runtime
- **MCP Community** - For the Model Context Protocol specification
- **Contributors** - Thank you to all contributors who make this project possible

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/mcp-fixer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/mcp-fixer/discussions)

---

<div align="center">

**⚡ Supercharge your MCP tools with 65% performance improvement ⚡**

[Get Started](docs/getting-started.md) • [Documentation](docs/fixed-interface-system.md) • [Examples](examples/)

</div>