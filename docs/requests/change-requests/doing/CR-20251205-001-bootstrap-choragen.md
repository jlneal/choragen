# Change Request: Bootstrap Choragen Repository

**ID**: CR-20251205-001  
**Domain**: core  
**Status**: doing  
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
- `@choragen/eslint-plugin`: Placeholder for rules
- `@choragen/test-utils`: unsafeCast utility
- Unit tests for core modules
- Architecture documentation

**Out of Scope**:
- ESLint rule extraction (Phase 3)
- Validation script extraction (Phase 3)
- Integration with itinerary-planner (Phase 4)

---

## Commits

- `d2d4655` feat: bootstrap choragen monorepo structure
- `fc05b16` feat: implement task chain system (Phase 2)
- `13d2764` test: add unit tests for core modules

---

## Implementation Notes

The task chain system uses markdown files in kanban-style directories:
- `docs/tasks/{backlog,todo,in-progress,in-review,done,blocked}/`
- Chain directories: `CHAIN-NNN-slug/`
- Task files: `NNN-slug.md`

Governance is defined in `choragen.governance.yaml` with allow/approve/deny rules.

---

## Linked ADRs

- ADR-001: Task file format and directory structure
- ADR-002: Governance schema design

---

## Completion Notes

[To be added when moved to done/]
