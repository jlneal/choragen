# Task: Implement event-driven orchestration hooks

**Chain**: CHAIN-072-standard-workflow  
**Task**: 007-T007-event-orchestration-hooks  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement event-driven orchestration hooks that trigger on task/chain state changes. These hooks enable the workflow to progress without polling.

---

## Expected Files

- `packages/core/src/hooks/events.ts` — Event definitions
- `packages/core/src/hooks/emitter.ts` — Event emitter
- `packages/core/src/hooks/handlers.ts` — Hook handlers for workflow events
- `packages/core/src/hooks/__tests__/events.test.ts` — Tests

---

## File Scope

- `packages/core/src/hooks/**`

---

## Acceptance Criteria

- [x] Event types defined: `task:submitted`, `task:approved`, `task:changes_requested`, `chain:approved`, `chain:changes_requested`, `request:approved`, `request:changes_requested`
- [x] Event emitter can register and trigger handlers
- [x] Hooks can trigger file moves (e.g., move task to in-review/)
- [x] Hooks can trigger agent spawning (emit spawn event)
- [x] Hooks can update status fields in task/chain files
- [x] Tests cover event emission and handler execution

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
