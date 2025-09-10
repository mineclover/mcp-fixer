# mcp-fixer Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-10

## Active Technologies

**Current Feature**: 002-claude-mcp-add (MCP Server Fixed Interface Optimization) - extends 001

- **Language/Version**: TypeScript with Bun runtime
- **Primary Dependencies**: @modelcontextprotocol/sdk, Zod validation, OAuth 2.0 client library, AJV for JSON Schema
- **Storage**: bun:sqlite (extends existing schema with fixed interfaces and OAuth tokens)
- **Testing**: Bun test framework with contract-first TDD approach
- **Project Type**: single (extends existing CLI tool with fixed interface optimization)

## Project Structure

```
src/
├── models/              # Data models (Query, Tool, Credential, Collector)
├── services/            # Core business logic
│   ├── discovery/       # MCP tool discovery
│   ├── query/          # Query management
│   ├── auth/           # Authentication handling
│   └── collector/      # Data collector management
├── cli/                # Command-line interface
└── lib/                # Shared utilities

tests/
├── contract/           # Contract tests for MCP tool integration
├── integration/        # Integration tests with real SQLite/MCP tools
└── unit/              # Unit tests for individual components
```

## Key Libraries

- **mcp-discovery**: Tool discovery and analysis
- **query-engine**: Query creation, storage, execution  
- **auth-manager**: Credential storage and authentication
- **data-collector**: Custom collector registration and execution
- **cli-interface**: Command-line interface
- **fixed-interface-manager**: Interface caching and optimization (NEW in 002)
- **oauth-flow-manager**: OAuth 2.0 authentication handling (NEW in 002)

## Commands

```bash
# Tool Discovery
mcp-tool discover [options] [endpoint]
mcp-tool tools [options]

# Authentication Management  
mcp-tool auth [options] <tool-id>

# Query Management
mcp-tool query create [options] <name>
mcp-tool query list [options]  
mcp-tool query run [options] <query-name>

# Data Collectors
mcp-tool collector register [options] <path>
mcp-tool collector list [options]
mcp-tool collector run [options] <name>

# System Commands
mcp-tool init [options] [path]
mcp-tool status [options]

# Fixed Interface Management (NEW in 002)
mcp-tool fixed register <tool-id> <operation-name> [options]
mcp-tool fixed list [tool-id] [options]
mcp-tool fixed use <interface-name> [parameters] [options]
mcp-tool fixed test <interface-name> [options]
mcp-tool fixed auth <tool-id> [options]
mcp-tool fixed stats [interface-name] [options]
```

## Core Principles

- **TDD Enforced**: RED-GREEN-Refactor cycle mandatory
- **Library-First**: Every feature implemented as standalone library
- **Local-First**: bun:sqlite for offline-capable storage
- **MCP Native**: Direct integration with Model Context Protocol
- **Security-First**: AES-256 encrypted credential storage

## Code Style

- **TypeScript**: Strict mode with Zod runtime validation
- **Error Handling**: Structured error types with recovery strategies  
- **Testing**: Contract → Integration → E2E → Unit test order
- **Database**: Direct SQLite access, no ORM/Repository patterns
- **CLI**: Commander.js with JSON/table/CSV output formats

## Database Schema

Tables: tools, credentials, queries, collectors, executions, audit_log, configuration

Key relationships:
- Tools → Credentials (1:many)
- Tools → Queries (1:many)  
- Queries → Executions (1:many)
- Independent: Collectors

## Recent Changes

- **002-claude-mcp-add**: Added fixed interface optimization + OAuth 2.0 flows + performance analytics
- **001-mcp-tool-mcp**: Added TypeScript + Bun + bun:sqlite + MCP SDK + optional LangChain integration

## Performance Goals

- Query execution: <500ms
- Tool discovery: <2s  
- Authentication caching enabled
- Local-first operation priority

## Security Requirements

- Encrypted credential storage (AES-256)
- System keychain integration
- No credentials in logs/errors
- Audit logging for sensitive operations

<!-- MANUAL ADDITIONS START -->
<!-- Add any manual development notes here -->
<!-- MANUAL ADDITIONS END -->