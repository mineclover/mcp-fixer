# Implementation Plan: MCP Server Fixed Interface Optimization

**Branch**: `002-claude-mcp-add` | **Date**: 2025-09-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-claude-mcp-add/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Fixed interface optimization system for MCP tools that enables fast access through pre-defined interfaces, avoiding dynamic discovery overhead while supporting OAuth flows and interface specification management.

**User Context**: Building upon existing MCP tool research from specs/001-mcp-tool-mcp. Focus on extracting successful MCP usage interfaces and storing them for fast, repeated access. Context7 and Notion MCP servers serve as test cases with OAuth authentication flows.

## Technical Context
**Language/Version**: TypeScript with Bun runtime (inheriting from 001-mcp-tool-mcp)  
**Primary Dependencies**: @modelcontextprotocol/sdk, Zod validation, Commander CLI (extend existing base)  
**Storage**: bun:sqlite database (extend existing schema from 001 feature)  
**Testing**: Bun test framework with contract-first TDD approach  
**Target Platform**: Node.js/Bun CLI tool, cross-platform
**Project Type**: single (extends existing MCP tool management project)  
**Performance Goals**: <100ms for fixed interface access vs >500ms for dynamic discovery  
**Constraints**: OAuth token management, interface versioning, backward compatibility with 001 codebase  
**Scale/Scope**: Support 10+ MCP servers with 50+ fixed interfaces, handle OAuth flows for multiple providers

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (extends existing single MCP tool project) ✓
- Using framework directly? (no wrapper classes) ✓ - Direct MCP SDK usage, minimal abstractions
- Single data model? (no DTOs unless serialization differs) ✓ - Reuse/extend existing entities
- Avoiding patterns? (no Repository/UoW without proven need) ✓ - Direct SQLite access

**Architecture**:
- EVERY feature as library? (no direct app code) ✓ - fixed-interface-manager library
- Libraries listed: fixed-interface-manager (interface storage/retrieval), oauth-flow-manager (authentication)  
- CLI per library: mcp-tool fixed [add|list|use|test] commands extending existing CLI
- Library docs: llms.txt format planned? ✓ - Extend existing project docs

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first) ✓ - TDD mandatory per 001 spec
- Git commits show tests before implementation? ✓ - Contract tests written first
- Order: Contract→Integration→E2E→Unit strictly followed? ✓
- Real dependencies used? (actual DBs, not mocks) ✓ - Use actual MCP servers for testing
- Integration tests for: new libraries, contract changes, shared schemas? ✓ - Context7/Notion integration tests
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ - Extend existing logging from 001 spec
- Frontend logs → backend? (unified stream) N/A - CLI tool only
- Error context sufficient? ✓ - OAuth errors, interface validation errors

**Versioning**:
- Version number assigned? ✓ - Extends existing project versioning
- BUILD increments on every change? ✓ - Follow existing 001 practices
- Breaking changes handled? (parallel tests, migration plan) ✓ - Database schema migration needed

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
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
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach  
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Extend existing 001-mcp-tool-mcp codebase rather than create new project
- Build upon existing libraries: mcp-discovery, auth-manager, cli-interface

**Contract-Based Task Generation**:
- CLI commands contract → 6 contract test tasks [P]
  - mcp-tool fixed register command test
  - mcp-tool fixed list command test  
  - mcp-tool fixed use command test
  - mcp-tool fixed test command test
  - mcp-tool fixed auth command test
  - mcp-tool fixed stats command test
- Database schema contract → migration and setup tasks
- API integration contract → Context7 and Notion integration tests

**Entity-Based Task Generation**:
- FixedInterface model → model creation task [P]
- OAuthConfiguration model → model creation task [P]
- OAuthToken model → model creation task [P]  
- PerformanceMetric model → model creation task [P]
- Each model → validation and lifecycle management tasks

**Service Layer Tasks**:
- fixed-interface-manager library → interface registration, retrieval, validation
- oauth-flow-manager library → OAuth 2.0 flow handling, token management
- Performance analytics service → metrics collection, reporting
- Database migration service → schema updates, data migration

**Integration Testing Strategy**:
- Real Context7 MCP server integration tests
- Real Notion OAuth flow integration tests
- Performance benchmarking tests (fixed vs dynamic access)
- End-to-end quickstart scenario validation

**Ordering Strategy**:
1. **Setup & Migration**: Database schema extension, dependency updates
2. **Contract Tests**: TDD - All CLI contract tests must fail initially
3. **Models**: Data entities implementation (FixedInterface, OAuth entities)
4. **Core Libraries**: fixed-interface-manager, oauth-flow-manager
5. **CLI Commands**: Extend existing CLI with fixed interface commands
6. **Integration**: Context7 and Notion server integration  
7. **Analytics**: Performance metrics and reporting
8. **Validation**: End-to-end testing and quickstart validation

**Parallelization Opportunities [P]**:
- Contract tests (different CLI commands) 
- Model implementations (different entities)
- Library development (fixed-interface vs oauth-flow managers)
- Integration tests (Context7 vs Notion)

**Dependencies Management**:
- All tasks depend on existing 001-mcp-tool-mcp foundation
- Database migration must complete before model implementation
- OAuth models must complete before OAuth flow manager
- CLI framework extension must complete before specific command implementation
- Integration tests require working models and services

**Performance Validation Tasks**:
- Benchmark existing dynamic discovery performance (baseline)
- Implement performance metrics collection
- Validate <100ms fixed interface access target
- Demonstrate >50% improvement over dynamic discovery

**Estimated Task Breakdown**:
- Setup & Migration: 3-4 tasks
- Contract Tests: 6 tasks [P]
- Models: 4 tasks [P]  
- Core Libraries: 4-5 tasks
- CLI Extensions: 6 tasks
- Integration: 4-5 tasks
- Analytics & Validation: 3-4 tasks
- **Total**: 30-35 numbered, ordered tasks

**Success Criteria for /tasks Command**:
- All contract tests written and failing (RED phase)
- Clear dependency ordering for implementation
- Parallel execution opportunities clearly marked
- Integration with existing 001 codebase maintained
- Performance targets and validation criteria defined

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✓
- [x] Phase 1: Design complete (/plan command) ✓
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✓
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✓
- [x] Post-Design Constitution Check: PASS ✓
- [x] All NEEDS CLARIFICATION resolved ✓
- [x] Complexity deviations documented: N/A (no violations) ✓

**Artifacts Generated**:
- [x] research.md: Technology decisions and integration strategies ✓
- [x] data-model.md: Extended data model with 4 new entities ✓
- [x] contracts/cli-commands.md: 6 CLI command specifications ✓
- [x] contracts/database-schema.sql: Database schema extensions ✓
- [x] contracts/api-integration.md: Context7 and Notion integration specs ✓
- [x] quickstart.md: End-to-end validation scenarios ✓
- [x] CLAUDE.md: Updated with new feature context ✓

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*