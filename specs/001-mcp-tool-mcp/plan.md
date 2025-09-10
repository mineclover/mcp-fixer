# Implementation Plan: MCP Tool Management & Query System

**Branch**: `001-mcp-tool-mcp` | **Date**: 2025-09-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mcp-tool-mcp/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✅
   → Detect Project Type: single (CLI tool with database)
   → Set Structure Decision: Option 1 (single project)
3. Evaluate Constitution Check section below ✅
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ✅
   → All NEEDS CLARIFICATION items resolved
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✅
   → All design artifacts generated successfully
6. Re-evaluate Constitution Check section ✅
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Create an MCP tool management system that discovers MCP tools, converts their usage patterns into reusable queries, provides CLI interface for execution, supports custom data collectors, and handles authentication automatically.

Technical approach: Bun + TypeScript implementation with local-first bun:sqlite storage, potential integration with LangChain/LangGraph for MCP orchestration.

## Technical Context
**Language/Version**: TypeScript with Bun runtime (latest)  
**Primary Dependencies**: @modelcontextprotocol/sdk, LangChain/LangGraph (optional), Zod for validation  
**Storage**: bun:sqlite (local-first storage)  
**Testing**: Bun test framework with integration tests  
**Target Platform**: Node.js-compatible CLI tool  
**Project Type**: single (CLI tool with database backend)  
**Performance Goals**: Query execution <500ms, Tool discovery <2s, Authentication caching  
**Constraints**: Local-first operation, Secure credential storage, Compatible with MCP specification  
**Scale/Scope**: 100+ MCP tools, 1000+ stored queries, Multiple authentication providers

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (cli + storage + MCP integration)
- Using framework directly? Yes (bun:sqlite, MCP SDK directly)
- Single data model? Yes (queries, tools, credentials, collectors unified)
- Avoiding patterns? Yes (direct storage access, no Repository/UoW)

**Architecture**:
- EVERY feature as library? Yes
- Libraries listed: 
  - mcp-discovery (tool discovery and analysis)
  - query-engine (query creation, storage, execution)
  - auth-manager (credential storage and authentication)
  - data-collector (custom collector registration and execution)
  - cli-interface (command-line interface)
- CLI per library: Each library exposes CLI commands with --help/--version/--format
- Library docs: llms.txt format planned? Yes

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (tests before implementation)
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual SQLite, real MCP tools)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:
- Structured logging included? Yes (JSON logs for CLI operations)
- Frontend logs → backend? N/A (CLI tool)
- Error context sufficient? Yes (detailed error context for debugging)

**Versioning**:
- Version number assigned? 0.1.0 (MAJOR.MINOR.BUILD)
- BUILD increments on every change? Yes
- Breaking changes handled? Yes (parallel tests, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/001-mcp-tool-mcp/
├── plan.md              # This file (/plan command output) ✅
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
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

**Structure Decision**: Option 1 (single project) - CLI tool with integrated database backend

## Phase 0: Outline & Research

### Research Tasks Identified
1. **MCP Authentication Methods**: Research MCP specification for supported authentication methods
2. **LangChain/LangGraph Integration**: Evaluate benefits and integration patterns
3. **Credential Storage Security**: Research secure local storage patterns for sensitive data
4. **Query Versioning Strategies**: Research approaches for handling tool API changes
5. **Data Collector Architecture**: Research plugin/module patterns for extensibility

### Research Questions to Resolve
- Which MCP authentication methods to support initially (API keys, OAuth, basic auth)?
- How to securely store credentials locally using bun:sqlite?
- What validation rules for data collector output compatibility?
- How to handle query versioning when tool APIs change?
- Integration patterns for LangChain/LangGraph with MCP tools?

**Next Step**: Generate research.md with findings for all identified research areas.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### Planned Outputs
1. **data-model.md**: Entity definitions for Query, Tool Definition, Credential Store, Data Collector, Execution Context
2. **contracts/**: CLI command specifications, database schema, MCP tool integration contracts
3. **quickstart.md**: Step-by-step user guide for discovering tools → creating queries → executing via CLI
4. **CLAUDE.md**: Updated context for Claude Code with current technology stack

### Design Approach
- Extract entities from feature spec functional requirements
- Generate CLI command contracts from user scenarios
- Create database schema for local storage
- Define integration contracts for MCP tools
- Generate contract tests that must fail initially

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Each CLI command → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Models → Services → CLI → Integration
- Database setup before model tests
- Authentication before query execution

**Estimated Output**: 25-30 numbered, ordered tasks focusing on:
1. Database schema and models (5-7 tasks)
2. MCP tool discovery (5-6 tasks)
3. Query management system (6-8 tasks)
4. Authentication handling (4-5 tasks)
5. CLI interface (5-7 tasks)
6. Integration tests (3-4 tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations identified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | | |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*