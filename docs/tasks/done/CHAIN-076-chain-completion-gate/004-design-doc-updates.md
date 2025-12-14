# Task: Update Design Documents

**Chain**: CHAIN-076-chain-completion-gate  
**Task**: 004-design-doc-updates  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Update the affected design documents to include the chain completion gate concept and document the new validation hooks.

---

## Context

Per the CR, these design documents need updates:
- `docs/design/core/features/standard-workflow.md` — Add chain completion gate concept
- `docs/design/core/features/task-chain-management.md` — Document chain lifecycle hooks with validation

This ensures the design documentation stays in sync with the implementation.

---

## Expected Files

- `docs/design/core/features/standard-workflow.md` (modify)
- `docs/design/core/features/task-chain-management.md` (modify)

---

## Acceptance Criteria

- [ ] Standard workflow doc explains chain completion gate purpose
- [ ] Task chain management doc includes validation hook configuration
- [ ] Both docs reference the new types and runner
- [ ] Acceptance criteria in design docs updated if needed

---

## Constraints

- Keep changes minimal — only add what's needed for the new feature
- Maintain existing document structure

---

## Notes

This task can run in parallel with task 003 since they touch different files.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
