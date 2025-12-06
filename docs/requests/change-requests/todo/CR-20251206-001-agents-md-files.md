# Change Request: Add AGENTS.md Files Throughout Repository

**ID**: CR-20251206-001  
**Domain**: core  
**Status**: todo  
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

- [ ] Each package has an AGENTS.md explaining its purpose
- [ ] Each AGENTS.md includes common patterns and conventions
- [ ] Each AGENTS.md references relevant ADRs
- [ ] Validation script checks for AGENTS.md presence

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Implementation Notes

Follow the pattern established in the root AGENTS.md and githooks/AGENTS.md.

---

## Completion Notes

[To be added when moved to done/]
