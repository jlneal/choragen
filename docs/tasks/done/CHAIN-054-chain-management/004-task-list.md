# Task: TaskList draggable component

**Chain**: CHAIN-054-chain-management  
**Task**: 004-task-list  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a draggable task list component for reordering tasks within a chain.


---

## Expected Files

- `packages/web/src/components/chains/task-list.tsx`

---

## Acceptance Criteria

- [x] Displays tasks in order with drag handles
- [x] Uses @dnd-kit or similar for drag-and-drop
- [x] Calls `chains.reorderTasks` on drop
- [x] Shows optimistic UI update during reorder
- [x] Includes delete button per task (calls `chains.deleteTask`)
- [x] Confirmation dialog before delete

---

## Notes

**Completed**: 2025-12-10

### Files Created/Modified

- `packages/web/src/components/chains/task-list.tsx` (new) - TaskList, SortableTaskItem, TaskListEmpty, TaskListSkeleton
- `packages/web/src/components/chains/index.ts` (modified) - Added exports

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
