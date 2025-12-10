# Task: Create TaskHistory component

**Chain**: CHAIN-055-task-control  
**Task**: 004-task-history  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a TaskHistory component that displays a timeline of task state changes.


---

## Expected Files

- `packages/web/src/components/tasks/task-history.tsx`
- `packages/web/src/components/tasks/index.ts` (export)
- `packages/web/src/server/routers/tasks.ts` (if history query needed)

---

## Acceptance Criteria

- [x] Displays timeline of status transitions (visual timeline with icons and connectors)
- [x] Shows timestamp for each transition (formatted + relative time)
- [x] Shows rework reason if applicable (from event metadata)
- [x] Visual timeline with status badges (icons per event type)
- [x] Handles tasks with no history gracefully (TaskHistoryEmpty component)
- [x] Loading skeleton while fetching (TaskHistorySkeleton component)

**Note**: Leveraged existing MetricsCollector from @choragen/core - no core changes needed.

---

## Notes

**Completed**: 2025-12-10

### Files Created/Modified

- `packages/web/src/components/tasks/task-history.tsx` - TaskHistory, TaskHistorySkeleton, TaskHistoryEmpty
- `packages/web/src/components/tasks/index.ts` - Added exports
- `packages/web/src/server/routers/tasks.ts` - Added `getHistory` procedure using MetricsCollector

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
