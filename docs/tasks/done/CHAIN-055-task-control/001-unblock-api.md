# Task: Add tasks.unblock tRPC procedure

**Chain**: CHAIN-055-task-control  
**Task**: 001-unblock-api  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add the missing `tasks.unblock` tRPC procedure to complete the task transition API surface.


---

## Expected Files

- `packages/web/src/server/routers/tasks.ts`
- `packages/core/src/task-manager.ts` (if `unblockTask` method missing)

---

## Acceptance Criteria

- [x] `tasks.unblock({ chainId, taskId })` procedure exists
- [x] Transitions blocked tasks back to todo status
- [x] Returns success/error result consistent with other transition procedures
- [x] Unit test covers the procedure (2 tests: success and failure cases)

---

## Notes

**Completed**: 2025-12-10

### Files Modified

- `packages/core/src/tasks/task-manager.ts` - Added `unblockTask()` method
- `packages/web/src/server/routers/tasks.ts` - Added `tasks.unblock` tRPC procedure
- `packages/web/src/__tests__/routers/tasks.test.ts` - Added unit tests for unblock

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
