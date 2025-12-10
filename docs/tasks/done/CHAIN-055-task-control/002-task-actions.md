# Task: Create TaskActions component

**Chain**: CHAIN-055-task-control  
**Task**: 002-task-actions  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a TaskActions component that displays available state transitions as a button group based on the current task status.


---

## Expected Files

- `packages/web/src/components/tasks/task-actions.tsx`
- `packages/web/src/components/tasks/index.ts` (export)

---

## Acceptance Criteria

- [x] Shows contextual actions based on current task status
- [x] todo → "Start" button
- [x] in-progress → "Complete", "Block" buttons
- [x] in-review → "Approve", "Rework" buttons
- [x] blocked → "Unblock" button
- [x] done → no actions
- [x] Loading state during transitions
- [x] Calls appropriate tRPC mutations
- [x] Emits toast notifications on success/error

---

## Notes

**Completed**: 2025-12-10

### Files Created

- `packages/web/src/components/tasks/task-actions.tsx` - TaskActions component
- `packages/web/src/components/tasks/index.ts` - Added export

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
