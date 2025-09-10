# Tasks: MCP Tool Management & Query System

**Input**: Design documents from `/specs/001-mcp-tool-mcp/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: Bun + TypeScript + bun:sqlite + MCP SDK
   → Libraries: mcp-discovery, query-engine, auth-manager, data-collector, cli-interface
   → Structure: Single project with src/ and tests/
2. Load optional design documents: ✓
   → data-model.md: 5 entities (Query, Tool, Credential, Collector, Execution)
   → contracts/: CLI spec, MCP integration, database schema
   → research.md: Auth methods, LangChain integration, security decisions
3. Generate tasks by category: ✓
   → Setup: Bun project, dependencies, SQLite schema
   → Tests: Contract tests, integration tests (TDD)
   → Core: Models, services, CLI commands
   → Integration: Database, MCP client, authentication
   → Polish: Unit tests, performance, documentation
4. Apply task rules: ✓
   → Different files = [P] for parallel execution
   → Tests before implementation (TDD mandatory)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness: ✓
   → All CLI commands have tests
   → All entities have models
   → All MCP operations implemented
9. Return: SUCCESS (30 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Bun project structure with TypeScript

## Phase 3.1: Setup

- [ ] **T001** Create project structure with src/{models,services,cli,lib}/ and tests/{contract,integration,unit}/
- [ ] **T002** Initialize Bun project with package.json, tsconfig.json, and core dependencies (@modelcontextprotocol/sdk, zod, commander)
- [ ] **T003** [P] Configure development tools: ESLint, Prettier, and Bun test configuration
- [ ] **T004** [P] Set up SQLite database schema in src/lib/database.ts using contracts/database-schema.sql
- [ ] **T005** [P] Create configuration management in src/lib/config.ts with environment variables and defaults

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### CLI Contract Tests
- [ ] **T006** [P] Contract test mcp-tool discover command in tests/contract/test_discover_command.test.ts
- [ ] **T007** [P] Contract test mcp-tool tools command in tests/contract/test_tools_command.test.ts  
- [ ] **T008** [P] Contract test mcp-tool auth command in tests/contract/test_auth_command.test.ts
- [ ] **T009** [P] Contract test mcp-tool query create command in tests/contract/test_query_create_command.test.ts
- [ ] **T010** [P] Contract test mcp-tool query run command in tests/contract/test_query_run_command.test.ts
- [ ] **T011** [P] Contract test mcp-tool collector commands in tests/contract/test_collector_command.test.ts

### Integration Tests  
- [ ] **T012** [P] Integration test tool discovery workflow in tests/integration/test_tool_discovery.test.ts
- [ ] **T013** [P] Integration test authentication flow in tests/integration/test_authentication.test.ts
- [ ] **T014** [P] Integration test query creation and execution in tests/integration/test_query_lifecycle.test.ts
- [ ] **T015** [P] Integration test data collector registration and execution in tests/integration/test_collector_integration.test.ts
- [ ] **T016** [P] Integration test database operations in tests/integration/test_database_operations.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] **T017** [P] Tool model in src/models/tool.ts with validation and types
- [ ] **T018** [P] Query model in src/models/query.ts with schema validation  
- [ ] **T019** [P] Credential model in src/models/credential.ts with encryption support
- [ ] **T020** [P] Collector model in src/models/collector.ts with file validation
- [ ] **T021** [P] Execution model in src/models/execution.ts with context tracking

### Core Services  
- [ ] **T022** [P] MCP tool discovery service in src/services/discovery/tool-discovery.ts
- [ ] **T023** [P] Authentication manager in src/services/auth/auth-manager.ts with credential encryption
- [ ] **T024** [P] Query engine in src/services/query/query-engine.ts for CRUD operations
- [ ] **T025** [P] Data collector manager in src/services/collector/collector-manager.ts
- [ ] **T026** MCP client integration in src/services/discovery/mcp-client.ts (depends on auth)

### CLI Commands
- [ ] **T027** Base CLI application in src/cli/index.ts with global options and command routing
- [ ] **T028** Discovery commands (discover, tools) in src/cli/commands/discovery.ts
- [ ] **T029** Authentication commands in src/cli/commands/auth.ts  
- [ ] **T030** Query management commands in src/cli/commands/query.ts
- [ ] **T031** Collector commands in src/cli/commands/collector.ts
- [ ] **T032** System commands (init, status) in src/cli/commands/system.ts

## Phase 3.4: Integration

- [ ] **T033** Connect all services to SQLite database with transaction support
- [ ] **T034** Implement credential encryption/decryption with system keychain integration
- [ ] **T035** Add structured logging with JSON output and error context
- [ ] **T036** Implement error handling and recovery strategies across all components
- [ ] **T037** Add configuration validation and environment-specific settings

## Phase 3.5: Polish  

- [ ] **T038** [P] Unit tests for data models in tests/unit/models/
- [ ] **T039** [P] Unit tests for utility functions in tests/unit/lib/
- [ ] **T040** [P] Performance tests for query execution (<500ms) and tool discovery (<2s)
- [ ] **T041** [P] Security tests for credential storage and encryption
- [ ] **T042** [P] Create CLI documentation and help text updates
- [ ] **T043** [P] Add comprehensive error messages and user guidance
- [ ] **T044** Manual testing using quickstart.md scenarios
- [ ] **T045** Performance optimization and memory usage validation

## Dependencies

### Critical Path Dependencies
- **Setup first**: T001-T005 must complete before all other phases
- **Tests before implementation**: T006-T016 MUST complete before T017-T032
- **Models before services**: T017-T021 must complete before T022-T026
- **Services before CLI**: T022-T026 must complete before T027-T032
- **Core before integration**: T017-T032 must complete before T033-T037
- **Implementation before polish**: T033-T037 must complete before T038-T045

### Specific Dependencies
- T026 (MCP client) depends on T023 (auth manager)
- T027 (base CLI) blocks T028-T032 (command implementations)
- T033 (database integration) depends on all models (T017-T021)
- T034 (encryption) depends on T019 (credential model) and T023 (auth manager)

## Parallel Execution Examples

### Phase 3.1 Setup (Partial Parallel)
```bash
# T002 must complete first, then run in parallel:
Task: "Configure development tools: ESLint, Prettier, and Bun test configuration"
Task: "Set up SQLite database schema in src/lib/database.ts using contracts/database-schema.sql"  
Task: "Create configuration management in src/lib/config.ts with environment variables and defaults"
```

### Phase 3.2 Contract Tests (Full Parallel)
```bash
# All contract tests can run in parallel:
Task: "Contract test mcp-tool discover command in tests/contract/test_discover_command.test.ts"
Task: "Contract test mcp-tool tools command in tests/contract/test_tools_command.test.ts"
Task: "Contract test mcp-tool auth command in tests/contract/test_auth_command.test.ts"
Task: "Contract test mcp-tool query create command in tests/contract/test_query_create_command.test.ts"
Task: "Contract test mcp-tool query run command in tests/contract/test_query_run_command.test.ts"
Task: "Contract test mcp-tool collector commands in tests/contract/test_collector_command.test.ts"
```

### Phase 3.3 Data Models (Full Parallel)
```bash
# All model implementations can run in parallel:
Task: "Tool model in src/models/tool.ts with validation and types"
Task: "Query model in src/models/query.ts with schema validation"
Task: "Credential model in src/models/credential.ts with encryption support"
Task: "Collector model in src/models/collector.ts with file validation"
Task: "Execution model in src/models/execution.ts with context tracking"
```

### Phase 3.5 Polish (Partial Parallel)
```bash
# Independent testing and documentation tasks:
Task: "Unit tests for data models in tests/unit/models/"
Task: "Unit tests for utility functions in tests/unit/lib/"
Task: "Performance tests for query execution (<500ms) and tool discovery (<2s)"
Task: "Security tests for credential storage and encryption"
Task: "Create CLI documentation and help text updates"
Task: "Add comprehensive error messages and user guidance"
```

## Task Generation Rules Applied

1. **From Contracts**:
   ✓ CLI spec → 6 contract test tasks (T006-T011) [P]
   ✓ Each command group → implementation task (T028-T032)
   
2. **From Data Model**:
   ✓ 5 entities → 5 model creation tasks (T017-T021) [P]
   ✓ Relationships → service layer tasks (T022-T026)
   
3. **From User Stories**:
   ✓ Quickstart scenarios → 5 integration tests (T012-T016) [P]
   ✓ User workflows → validation tasks (T044)

4. **Ordering**:
   ✓ Setup → Tests → Models → Services → CLI → Integration → Polish
   ✓ Dependencies properly sequenced

## Validation Checklist

- [x] All CLI commands have corresponding contract tests
- [x] All entities have model creation tasks  
- [x] All tests come before implementation (T006-T016 before T017-T032)
- [x] Parallel tasks are truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] TDD cycle enforced with failing tests before implementation
- [x] All functional requirements from spec covered by tasks

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Verify tests fail** before implementing (TDD requirement)
- **Commit after each task** for tracking progress
- **Bun-specific**: Use `bun test` for testing, `bun run` for execution
- **TypeScript strict mode** enforced throughout
- **Security priority**: Credential encryption implemented before any auth operations

## Success Criteria

- All 45 tasks completed in dependency order
- All tests pass (contract, integration, unit)
- CLI commands work as specified in quickstart.md
- Performance goals met (<500ms query, <2s discovery)
- Security requirements satisfied (encrypted credentials)
- Zero configuration required for basic usage