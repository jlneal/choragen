# Task: Integrate components into chain detail page

**Chain**: CHAIN-054-chain-management  
**Task**: 006-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Wire up all chain management components into the chain detail page with proper data flow and query invalidation.


---

## Expected Files

- `packages/web/src/app/chains/[chainId]/page.tsx`
- `packages/web/src/components/chains/index.ts` (exports)

---

## Acceptance Criteria

- [x] Chain detail page shows TaskList with all tasks
- [x] TaskAdder form at bottom of task list
- [x] TaskEditor inline editing works
- [x] Reordering persists and updates UI
- [x] Delete with confirmation works
- [x] All mutations properly invalidate queries
- [x] Error handling with toast notifications

---

## Notes

**Completed**: 2025-12-10

### Files Modified

- `packages/web/src/app/chains/[id]/chain-detail-content.tsx` - Integrated TaskList, TaskAdder
- `packages/web/src/components/tasks/task-detail-panel.tsx` - Added edit mode with TaskEditor
- `packages/web/src/components/chains/task-list.tsx` - Enhanced with toast notifications

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
