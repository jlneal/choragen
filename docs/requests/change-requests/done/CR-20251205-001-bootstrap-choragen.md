# Change Request: Bootstrap Choragen Repository

**ID**: CR-20251205-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-05  
**Owner**: Justin  

---

## What

Bootstrap the choragen monorepo with:
1. Package structure (`@choragen/core`, `@choragen/cli`, etc.)
2. Core task chain system
3. Governance schema enforcement
4. File locking for parallel chains
5. CLI commands for all operations

---

## Why

Choragen is being extracted from itinerary-planner to become a standalone, reusable framework for agentic software development. This CR covers the initial scaffolding and core functionality.

---

## Scope

**In Scope**:
- Monorepo structure with pnpm workspaces
- `@choragen/core`: Tasks, chains, governance, locks
- `@choragen/cli`: Command-line interface
- `@choragen/contracts`: DesignContract, ApiError, HttpStatus
- `@choragen/eslint-plugin`: Core traceability rules
- `@choragen/test-utils`: unsafeCast utility
- Unit tests for core modules
- Architecture documentation
- Git hooks (commit-msg, pre-commit)
- Document templates (CR, FR, ADR, feature)
- Self-hosted documentation structure

**Out of Scope**:
- Full ESLint rule extraction from itinerary-planner (Phase 3)
- Validation script extraction (Phase 3)
- Integration with itinerary-planner (Phase 4)

---

## Commits

- `d2d4655` feat: bootstrap choragen monorepo structure
- `fc05b16` feat: implement task chain system (Phase 2)
- `13d2764` test: add unit tests for core modules
- `3339d4b` docs: add self-hosted documentation structure
- `28c2f26` feat: add enforcement infrastructure

---

## Implementation Notes

The task chain system uses markdown files in kanban-style directories:
- `docs/tasks/{backlog,todo,in-progress,in-review,done,blocked}/`
- Chain directories: `CHAIN-NNN-slug/`
- Task files: `NNN-slug.md`

Governance is defined in `choragen.governance.yaml` with allow/approve/deny rules.

---

## Linked ADRs

- [ADR-001: Task file format](../../adr/done/ADR-001-task-file-format.md)
- [ADR-002: Governance schema](../../adr/done/ADR-002-governance-schema.md)
- [ADR-003: File locking](../../adr/done/ADR-003-file-locking.md)

---

## Remaining Work

All items completed:

- [x] Add more ESLint rules (require-design-contract, no-magic-numbers-http)
- [x] Add validation scripts (validate:links, validate:adr-traceability)
- [x] Add hooks:install CLI command
- [x] Add eslint.config.mjs for choragen itself
- [x] Ensure all source files have ADR references

---

## Completion Notes

**Completed**: 2025-12-06

The choragen monorepo has been successfully bootstrapped with:

1. **Package Structure**: 5 packages (`@choragen/core`, `@choragen/cli`, `@choragen/contracts`, `@choragen/eslint-plugin`, `@choragen/test-utils`)
2. **Core Task Chain System**: Task parsing, chain management, governance enforcement, file locking
3. **Unit Tests**: 32 tests passing across 3 test files
4. **Validation Infrastructure**: `validate:links` and `validate:adr-traceability` scripts
5. **ESLint Plugin**: Core traceability rules including `require-adr-reference`
6. **Documentation**: ADRs, design docs, and self-hosted documentation structure
7. **Git Hooks**: commit-msg and pre-commit hooks

All validation commands pass:
- `pnpm build`: ✅ 5 packages built
- `pnpm test`: ✅ 32 tests passing
- `pnpm validate:all`: ✅ 0 warnings
