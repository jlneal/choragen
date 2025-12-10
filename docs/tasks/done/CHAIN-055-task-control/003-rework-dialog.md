# Task: Create ReworkDialog component

**Chain**: CHAIN-055-task-control  
**Task**: 003-rework-dialog  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a ReworkDialog modal component for capturing the reason when sending a task back for rework.


---

## Expected Files

- `packages/web/src/components/tasks/rework-dialog.tsx`
- `packages/web/src/components/tasks/index.ts` (export)

---

## Acceptance Criteria

- [x] Modal dialog using shadcn/ui Dialog component
- [x] Text area for rework reason (optional but encouraged)
- [x] "Cancel" and "Send for Rework" buttons
- [x] Calls `tasks.rework` mutation with reason
- [x] Loading state during submission
- [x] Closes on success, shows error on failure
- [x] Keyboard accessible (Escape to close via Dialog primitive)

---

## Notes

**Completed**: 2025-12-10

### Files Created

- `packages/web/src/components/tasks/rework-dialog.tsx` - ReworkDialog modal component
- `packages/web/src/components/tasks/index.ts` - Added export

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
