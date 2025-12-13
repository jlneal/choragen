# Task: Update task lifecycle to include in-review state

**Chain**: CHAIN-072-standard-workflow  
**Task**: 006-T006-in-review-state  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the task lifecycle to include the `in-review` state. Currently tasks go from `in-progress` directly to `done`. The new flow is: `todo` → `in-progress` → `in-review` → `done`.

---

## Expected Files

- `packages/core/src/task/types.ts` — Update TaskStatus enum
- `packages/core/src/task/manager.ts` — Update state transitions
- `docs/tasks/in-review/` — Ensure directory exists
- `packages/core/src/task/__tests__/manager.test.ts` — Tests for new state

---

## File Scope

- `packages/core/src/task/**`
- `docs/tasks/in-review/`

---

## Acceptance Criteria

- [x] TaskStatus enum includes `in-review` state
- [x] Task manager supports `in-progress` → `in-review` transition
- [x] Task manager supports `in-review` → `done` transition (via approve)
- [x] Task manager supports `in-review` → `in-progress` transition (via request_changes)
- [x] `docs/tasks/in-review/` directory exists and is used
- [x] Tests cover all new state transitions

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
