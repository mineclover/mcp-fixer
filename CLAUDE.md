# mcp-fixer Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-09

## Active Technologies

**Current Feature**: 001-mcp-tool-mcp (MCP Tool Management & Query System)

- **Language/Version**: TypeScript with Bun runtime
- **Primary Dependencies**: @modelcontextprotocol/sdk, LangChain/LangGraph (optional), Zod for validation
- **Storage**: bun:sqlite (local-first storage)
- **Testing**: Bun test framework with integration tests
- **Project Type**: single (CLI tool with database backend)

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