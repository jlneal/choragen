# Task: Integrate TaskActions into TaskDetailPanel

**Chain**: CHAIN-055-task-control  
**Task**: 005-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Integrate TaskActions, ReworkDialog, and TaskHistory into the TaskDetailPanel for a complete task control experience.


---

## Expected Files

- `packages/web/src/components/tasks/task-detail-panel.tsx`

---

## Acceptance Criteria

- [x] TaskActions displayed prominently below status badge
- [x] ReworkDialog triggered by "Rework" action (via onReworkClick callback)
- [x] TaskHistory shown in collapsible section (expand/collapse toggle)
- [x] Panel refreshes after successful transitions (via query invalidation)
- [x] Smooth UX with proper loading states (inherited from child components)

---

## Notes

**Completed**: 2025-12-10

### Files Modified

- `packages/web/src/components/tasks/task-detail-panel.tsx` - Integrated TaskActions, ReworkDialog, TaskHistory
- `packages/web/src/components/tasks/task-actions.tsx` - Added `onReworkClick` prop for dialog delegation

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
