# Task: Add reorderTasks and deleteTask tRPC procedures

**Chain**: CHAIN-054-chain-management  
**Task**: 001-reorder-api  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add `chains.reorderTasks` and `chains.deleteTask` procedures to the chains router to support task reordering and deletion from the web UI.

---

## Expected Files

- `packages/web/src/server/routers/chains.ts`
- `packages/core/src/chain-manager.ts (if reorderTasks needs core support)`

---

## Acceptance Criteria

- [ ] chains.reorderTasks({ chainId, taskIds: string[] }) procedure exists
- [ ] chains.deleteTask({ chainId, taskId }) procedure exists
- [ ] Reordering updates the chain's task array order
- [ ] Deleting removes task file and updates chain metadata
- [ ] Both procedures have proper error handling for missing chains/tasks

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
