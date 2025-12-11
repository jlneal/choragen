# Task: Create /chat/history route with workflow list

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 001-workflow-history-route  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the `/chat/history` route that displays a list of all workflows (active, paused, completed, cancelled). This serves as the entry point for viewing past and ongoing workflow activity.

---

## Expected Files

- `packages/web/src/app/chat/history/page.tsx — History route page`
- `packages/web/src/server/routers/workflow.ts — Add workflow.list procedure if not exists`
- `packages/web/src/__tests__/chat/history.test.tsx — Tests for history page`

---

## Acceptance Criteria

- [ ] /chat/history route renders workflow history page
- [ ] Page fetches and displays list of all workflows
- [ ] Workflows grouped or sortable by status (active, paused, completed, cancelled)
- [ ] Each workflow shows: request ID, current stage, status, last activity time
- [ ] Clicking a workflow navigates to /chat/[workflowId]
- [ ] Empty state shown when no workflows exist

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
