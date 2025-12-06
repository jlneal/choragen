# Change Request: Add AGENTS.md Files Throughout Repository

**ID**: CR-20251206-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Add AGENTS.md files to each package and key directory to provide context for AI agents working in those areas.

---

## Why

AGENTS.md files are the primary way agents receive context about a codebase area. Without them, agents lack understanding of:
- Package purpose and architecture
- Coding conventions specific to that area
- Common patterns and anti-patterns
- Testing requirements

---

## Scope

**In Scope**:
- `packages/core/AGENTS.md` - Task chains, governance, locks
- `packages/cli/AGENTS.md` - CLI commands and handlers
- `packages/contracts/AGENTS.md` - DesignContract, ApiError, HttpStatus
- `packages/eslint-plugin/AGENTS.md` - ESLint rule development
- `packages/test-utils/AGENTS.md` - Test utilities
- `scripts/AGENTS.md` - Validation scripts
- `docs/AGENTS.md` - Documentation structure
- `templates/AGENTS.md` - Template usage

**Out of Scope**:
- Root AGENTS.md (already exists)
- githooks/AGENTS.md (already exists)

---

## Acceptance Criteria

- [x] Each package has an AGENTS.md explaining its purpose
- [x] Each AGENTS.md includes common patterns and conventions
- [x] Each AGENTS.md references relevant ADRs
- [x] Validation script checks for AGENTS.md presence (completed in CR-20251206-002)

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Implementation Notes

Follow the pattern established in the root AGENTS.md and githooks/AGENTS.md.

---

## Completion Notes

**Completed**: 2025-12-06

Added 8 AGENTS.md files via CHAIN-002-add-agents-md:

**Packages** (5 files):
- `packages/core/AGENTS.md` - Tasks, governance, locks
- `packages/cli/AGENTS.md` - CLI commands
- `packages/contracts/AGENTS.md` - DesignContract, ApiError, HttpStatus
- `packages/eslint-plugin/AGENTS.md` - ESLint rules
- `packages/test-utils/AGENTS.md` - unsafeCast utility

**Supporting directories** (3 files):
- `scripts/AGENTS.md` - Validation scripts
- `docs/AGENTS.md` - Documentation structure
- `templates/AGENTS.md` - Template usage

Each file includes purpose, key exports, patterns, and ADR references.
