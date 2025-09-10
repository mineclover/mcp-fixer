# Tasks: MCP Server Fixed Interface Optimization

**Input**: Design documents from `/specs/002-claude-mcp-add/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript + Bun + bun:sqlite + MCP SDK + OAuth 2.0 + AJV
   → Libraries: fixed-interface-manager, oauth-flow-manager (extends existing)
   → Structure: Single project extending existing 001-mcp-tool-mcp
2. Load optional design documents: ✓
   → data-model.md: 4 entities (FixedInterface, OAuthConfiguration, OAuthToken, PerformanceMetric)
   → contracts/: CLI commands spec, database schema, API integration spec
   → research.md: OAuth 2.0 PKCE, JSON Schema validation, caching strategies
   → quickstart.md: Context7 and Notion integration test scenarios
3. Generate tasks by category: ✓
   → Setup: Dependencies, database migration, development tools
   → Tests: Contract tests for 6 CLI commands, integration tests (TDD)
   → Core: 4 new models, 2 new libraries, 6 CLI commands
   → Integration: OAuth flows, performance analytics, server integration
   → Polish: Unit tests, performance validation, documentation
4. Apply task rules: ✓
   → Different files = [P] for parallel execution
   → Tests before implementation (TDD mandatory)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness: ✓
   → All CLI commands have tests
   → All entities have models
   → All integration scenarios covered
9. Return: SUCCESS (42 tasks ready for execution, 5 tasks require manual intervention for Notion OAuth)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- TypeScript with Bun runtime
- Extends existing 001-mcp-tool-mcp project structure

## Phase 3.1: Setup & Migration

- [ ] **T001** Extend package.json with new dependencies: oauth2-server, ajv for JSON Schema validation, and performance monitoring utilities
- [ ] **T002** Create database migration script in src/lib/migrations/002-fixed-interfaces.sql implementing contracts/database-schema.sql
- [ ] **T003** [P] Configure TypeScript types for new entities (FixedInterface, OAuthConfiguration, OAuthToken, PerformanceMetric)
- [ ] **T004** [P] Update ESLint and Prettier configurations to handle new OAuth and interface management code patterns

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### CLI Contract Tests
- [ ] **T005** [P] Contract test mcp-tool fixed register command in tests/contract/test_fixed_register_command.test.ts
- [ ] **T006** [P] Contract test mcp-tool fixed list command in tests/contract/test_fixed_list_command.test.ts
- [ ] **T007** [P] Contract test mcp-tool fixed use command in tests/contract/test_fixed_use_command.test.ts
- [ ] **T008** [P] Contract test mcp-tool fixed test command in tests/contract/test_fixed_test_command.test.ts
- [ ] **T009** [P] Contract test mcp-tool fixed auth command in tests/contract/test_fixed_auth_command.test.ts (⚠️ MANUAL: Notion OAuth requires browser redirect - pause implementation when redirect occurs)
- [ ] **T010** [P] Contract test mcp-tool fixed stats command in tests/contract/test_fixed_stats_command.test.ts

### Integration Tests
- [ ] **T011** [P] Integration test Context7 MCP server interface registration workflow in tests/integration/test_context7_integration.test.ts
- [ ] **T012** [P] Integration test Notion OAuth 2.0 authorization flow end-to-end in tests/integration/test_notion_oauth_integration.test.ts (⚠️ MANUAL: Requires browser redirect - STOP and notify when OAuth flow initiates browser authentication)
- [ ] **T013** [P] Integration test fixed interface performance vs dynamic discovery in tests/integration/test_performance_comparison.test.ts
- [ ] **T014** [P] Integration test interface validation and schema change detection in tests/integration/test_interface_validation.test.ts
- [ ] **T015** [P] Integration test OAuth token refresh and expiry handling in tests/integration/test_oauth_token_lifecycle.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] **T016** [P] FixedInterface model in src/models/fixed-interface.ts with validation, state transitions, and relationships
- [ ] **T017** [P] OAuthConfiguration model in src/models/oauth-configuration.ts with provider settings and validation
- [ ] **T018** [P] OAuthToken model in src/models/oauth-token.ts with encrypted storage and lifecycle management
- [ ] **T019** [P] PerformanceMetric model in src/models/performance-metric.ts with analytics and comparison capabilities

### Core Libraries
- [ ] **T020** [P] Fixed interface manager library in src/services/fixed-interface/interface-manager.ts for registration, retrieval, and validation
- [ ] **T021** [P] OAuth flow manager library in src/services/oauth/oauth-flow-manager.ts for OAuth 2.0 with PKCE implementation (⚠️ MANUAL: Include browser redirect detection and implementation pause mechanism)
- [ ] **T022** Interface specification validator in src/services/fixed-interface/interface-validator.ts for schema comparison and validation
- [ ] **T023** Performance analytics service in src/services/analytics/performance-analytics.ts for metrics collection and reporting

### CLI Commands Implementation
- [ ] **T024** Base fixed command group in src/cli/commands/fixed.ts with subcommand routing and global options
- [ ] **T025** Register command implementation in src/cli/commands/fixed/register.ts for interface registration workflow
- [ ] **T026** List command implementation in src/cli/commands/fixed/list.ts with filtering and formatting options
- [ ] **T027** Use command implementation in src/cli/commands/fixed/use.ts for fixed interface execution
- [ ] **T028** Test command implementation in src/cli/commands/fixed/test.ts for interface validation
- [ ] **T029** Auth command implementation in src/cli/commands/fixed/auth.ts for OAuth flow handling (⚠️ MANUAL: CRITICAL - Must pause execution and notify user when Notion OAuth requires browser redirect)
- [ ] **T030** Stats command implementation in src/cli/commands/fixed/stats.ts for performance analytics

## Phase 3.4: Integration & Database

- [ ] **T031** Connect fixed interface models to SQLite database with transaction support and foreign key constraints
- [ ] **T032** Implement OAuth token encryption/decryption with system keychain integration for secure credential storage
- [ ] **T033** Add structured logging for fixed interface operations, OAuth flows, and performance metrics
- [ ] **T034** Implement error handling and recovery strategies for MCP server failures and OAuth token expiry

## Phase 3.5: Polish & Validation

- [ ] **T035** [P] Unit tests for fixed interface models and validation logic in tests/unit/models/
- [ ] **T036** [P] Unit tests for OAuth flow components and token management in tests/unit/oauth/
- [ ] **T037** [P] Performance benchmarks validating <100ms fixed interface access and >50% improvement over dynamic discovery
- [ ] **T038** [P] Security tests for OAuth token encryption and secure storage practices
- [ ] **T039** [P] Update CLI help documentation for all new fixed interface commands
- [ ] **T040** [P] Add comprehensive error messages and user guidance for OAuth setup and interface registration
- [ ] **T041** Manual testing using quickstart.md scenarios for Context7 and Notion integration (⚠️ MANUAL: Notion OAuth testing requires human intervention for browser authentication - coordinate with user before executing)
- [ ] **T042** Performance optimization and memory usage validation for interface caching

## Dependencies

### Critical Path Dependencies
- **Setup first**: T001-T004 must complete before all other phases
- **Tests before implementation**: T005-T015 MUST complete before T016-T030
- **Models before services**: T016-T019 must complete before T020-T023
- **Services before CLI**: T020-T023 must complete before T024-T030
- **Core before integration**: T016-T030 must complete before T031-T034
- **Implementation before polish**: T031-T034 must complete before T035-T042

### Specific Dependencies
- T002 (migration) must complete before T016-T019 (models)
- T020 (interface manager) depends on T016 (FixedInterface model)
- T021 (OAuth flow manager) depends on T017-T018 (OAuth models)
- T024 (base CLI) blocks T025-T030 (specific commands)
- T031 (database integration) depends on all models (T016-T019)
- T032 (encryption) depends on T018 (OAuthToken model) and T021 (OAuth manager)

## Parallel Execution Examples

### Phase 3.2 Contract Tests (Full Parallel)
```bash
# All contract tests can run in parallel:
Task: "Contract test mcp-tool fixed register command in tests/contract/test_fixed_register_command.test.ts"
Task: "Contract test mcp-tool fixed list command in tests/contract/test_fixed_list_command.test.ts"
Task: "Contract test mcp-tool fixed use command in tests/contract/test_fixed_use_command.test.ts"
Task: "Contract test mcp-tool fixed test command in tests/contract/test_fixed_test_command.test.ts"
Task: "Contract test mcp-tool fixed auth command in tests/contract/test_fixed_auth_command.test.ts"
Task: "Contract test mcp-tool fixed stats command in tests/contract/test_fixed_stats_command.test.ts"
```

### Phase 3.2 Integration Tests (Full Parallel)
```bash
# All integration tests can run in parallel:
Task: "Integration test Context7 MCP server interface registration workflow in tests/integration/test_context7_integration.test.ts"
Task: "Integration test Notion OAuth 2.0 authorization flow end-to-end in tests/integration/test_notion_oauth_integration.test.ts" ⚠️ MANUAL REQUIRED
Task: "Integration test fixed interface performance vs dynamic discovery in tests/integration/test_performance_comparison.test.ts"
Task: "Integration test interface validation and schema change detection in tests/integration/test_interface_validation.test.ts"
Task: "Integration test OAuth token refresh and expiry handling in tests/integration/test_oauth_token_lifecycle.test.ts"
```

### Phase 3.3 Data Models (Full Parallel)
```bash
# All model implementations can run in parallel:
Task: "FixedInterface model in src/models/fixed-interface.ts with validation, state transitions, and relationships"
Task: "OAuthConfiguration model in src/models/oauth-configuration.ts with provider settings and validation"
Task: "OAuthToken model in src/models/oauth-token.ts with encrypted storage and lifecycle management"
Task: "PerformanceMetric model in src/models/performance-metric.ts with analytics and comparison capabilities"
```

### Phase 3.5 Polish (Partial Parallel)
```bash
# Independent testing and documentation tasks:
Task: "Unit tests for fixed interface models and validation logic in tests/unit/models/"
Task: "Unit tests for OAuth flow components and token management in tests/unit/oauth/"
Task: "Performance benchmarks validating <100ms fixed interface access and >50% improvement over dynamic discovery"
Task: "Security tests for OAuth token encryption and secure storage practices"
Task: "Update CLI help documentation for all new fixed interface commands"
Task: "Add comprehensive error messages and user guidance for OAuth setup and interface registration"
```

## Task Generation Rules Applied

1. **From Contracts**:
   ✓ CLI commands spec → 6 contract test tasks (T005-T010) [P]
   ✓ Database schema → migration task (T002)
   ✓ API integration → integration tests (T011-T015) [P]
   
2. **From Data Model**:
   ✓ 4 entities → 4 model creation tasks (T016-T019) [P]
   ✓ Relationships → service layer tasks (T020-T023)
   
3. **From Quickstart Scenarios**:
   ✓ Context7 integration → integration test (T011)
   ✓ Notion OAuth flow → integration test (T012)
   ✓ Performance comparison → integration test (T013)
   ✓ Interface validation → integration test (T014)
   ✓ Manual validation → quickstart execution task (T041)

4. **Ordering**:
   ✓ Setup → Tests → Models → Services → CLI → Integration → Polish
   ✓ Dependencies properly sequenced

## Validation Checklist

- [x] All CLI commands have corresponding contract tests
- [x] All entities have model creation tasks  
- [x] All tests come before implementation (T005-T015 before T016-T030)
- [x] Parallel tasks are truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] TDD cycle enforced with failing tests before implementation
- [x] All functional requirements from spec covered by tasks
- [x] OAuth integration and security requirements addressed
- [x] Performance targets and validation included

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Verify tests fail** before implementing (TDD requirement)
- **Commit after each task** for tracking progress
- **Bun-specific**: Use `bun test` for testing, `bun run` for execution
- **TypeScript strict mode** enforced throughout
- **Security priority**: OAuth token encryption implemented before any auth operations
- **Performance focus**: Validate <100ms fixed interface access vs >500ms dynamic discovery

## ⚠️ CRITICAL: Notion OAuth Manual Intervention Requirements

**Affected Tasks**: T009, T012, T021, T029, T041

**Issue**: Notion MCP server OAuth authentication requires browser page redirects that cannot be automated.

**Required Actions**:
1. **Implementation Pause**: When tasks reach OAuth browser redirect points, STOP execution immediately
2. **User Notification**: Alert user that manual browser authentication is required
3. **Coordination**: Wait for user to complete OAuth flow before resuming
4. **Error Handling**: Implement graceful pause/resume mechanism for OAuth flows
5. **Documentation**: Clearly document where manual intervention is required

**Implementation Guidelines**:
- Add detection logic for OAuth redirect initiation
- Implement pause/notification mechanism before browser launch
- Provide clear instructions to user for manual completion
- Design resume functionality after OAuth completion
- Test OAuth flow coordination with user interaction

**Testing Strategy**:
- Mock OAuth flows for automated testing
- Separate manual OAuth testing into dedicated test scenarios
- Coordinate with user for integration test execution
- Document OAuth testing procedures for future developers

## Success Criteria

- All 42 tasks completed in dependency order
- All tests pass (contract, integration, unit)
- CLI commands work as specified in quickstart.md
- Performance goals met (<100ms fixed interface, >50% improvement over dynamic)
- Security requirements satisfied (encrypted OAuth tokens)
- Seamless integration with existing 001-mcp-tool-mcp codebase
- Context7 and Notion integration scenarios successful