# Task: Chain Detail Page

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 005-chain-detail-page  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Implement the `/chains/[id]` page with chain metadata and task list.

---

## Description

Replace the placeholder chain detail page with full functionality:

1. **ChainHeader** component:
   - Chain ID and title
   - Type badge
   - Status badge
   - Progress bar with percentage
   - Created date
   - Request ID link (clickable to /requests/[id])

2. **Page layout**:
   - Back to chains link
   - Chain header section
   - Task list section
   - Task detail panel integration

3. **Data fetching**:
   - tRPC `chains.get` for chain metadata
   - tRPC `chains.getSummary` for progress
   - tRPC `tasks.listForChain` for tasks

---

## Expected Files

- `packages/web/src/components/chains/chain-header.tsx`
- `packages/web/src/app/chains/[id]/page.tsx` (update)

---

## Acceptance Criteria

- [ ] `/chains/[id]` shows chain detail with tasks
- [ ] Chain header shows: ID, title, type, request, progress, status
- [ ] Task list shows all tasks with status badges
- [ ] Click task opens detail panel with full info
- [ ] Progress bar accurately reflects task completion
- [ ] Link to associated request works
- [ ] 404 handling for non-existent chains

---

## Constraints

- Server component for initial data fetch where possible
- Client components for interactive elements
- ADR reference: ADR-011-web-api-architecture

---

## Notes

Depends on tasks 003 and 004 for TaskList and TaskDetailPanel.
