# Task: Task List Components

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 003-task-list-components  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Create the reusable components for displaying tasks within a chain.

---

## Description

Build the task visualization components:

1. **TaskRow** - Individual task row showing:
   - Task number and slug
   - Title
   - Status badge with icon
   - Click handler for detail panel

2. **TaskStatusBadge** - Status indicator for tasks:
   - backlog, todo, in-progress, in-review, done, blocked
   - Icons: Circle, CircleDot, Play, Eye, CheckCircle, XCircle
   - Color coding per status

3. **TaskList** - Container for task rows:
   - Ordered list of TaskRow components
   - Empty state for no tasks
   - Loading skeleton

---

## Expected Files

- `packages/web/src/components/tasks/task-row.tsx`
- `packages/web/src/components/tasks/task-status-badge.tsx`
- `packages/web/src/components/tasks/task-list.tsx`
- `packages/web/src/components/tasks/index.ts`

---

## Acceptance Criteria

- [ ] TaskRow displays task number, slug, title, status
- [ ] TaskStatusBadge shows correct icon and color per status
- [ ] TaskList renders ordered tasks
- [ ] Components handle empty and loading states
- [ ] Click on TaskRow triggers callback (for detail panel)

---

## Constraints

- Use existing `@/components/ui/*` components
- Follow status flow: backlog → todo → in-progress → in-review → done
- ADR reference: ADR-011-web-api-architecture

---

## Notes

Status colors suggestion:
- backlog: gray
- todo: blue
- in-progress: yellow/amber
- in-review: purple
- done: green
- blocked: red
