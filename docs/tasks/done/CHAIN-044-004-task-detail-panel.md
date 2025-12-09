# Task: Task Detail Panel

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 004-task-detail-panel  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Create a slide-out panel for viewing task details.

---

## Description

Build a Sheet-based detail panel for tasks:

1. **TaskDetailPanel** component using shadcn Sheet:
   - Opens from right side
   - Shows full task information:
     - Title and description
     - Status with badge
     - Expected files list
     - Acceptance criteria checklist
     - Constraints
     - Notes
   - Close button

2. **Integration hook**:
   - `useTaskDetail` hook for managing panel state
   - Selected task ID state
   - Open/close handlers

---

## Expected Files

- `packages/web/src/components/tasks/task-detail-panel.tsx`
- `packages/web/src/hooks/use-task-detail.ts`

---

## Acceptance Criteria

- [ ] Panel slides in from right when task clicked
- [ ] Displays all task metadata (title, description, status)
- [ ] Shows expected files as a list
- [ ] Shows acceptance criteria as checklist
- [ ] Shows constraints and notes
- [ ] Panel closes on X button or outside click
- [ ] Loading state while fetching task details

---

## Constraints

- Use existing Sheet component from `@/components/ui/sheet`
- Fetch full task details via tRPC `tasks.get`
- ADR reference: ADR-011-web-api-architecture

---

## Notes

The Sheet component is already available in the UI library.
