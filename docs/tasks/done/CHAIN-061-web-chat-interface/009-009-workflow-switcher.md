# Task: Create WorkflowSwitcher component to switch between active workflows

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 009-009-workflow-switcher  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the WorkflowSwitcher component that allows users to switch between active workflows without leaving the chat interface.

---

## Expected Files

- `packages/web/src/components/chat/workflow-switcher.tsx — Dropdown/selector for workflows`
- `Update packages/web/src/app/chat/layout.tsx — Include WorkflowSwitcher in header`

---

## Acceptance Criteria

- [ ] WorkflowSwitcher shows current workflow name/ID
- [ ] Dropdown lists all active workflows (status: active, paused)
- [ ] Each item shows workflow request ID, title, and status badge
- [ ] Selecting a workflow navigates to /chat/[workflowId]
- [ ] Current workflow highlighted in list
- [ ] "Start New Workflow" option at bottom of list
- [ ] Loading state while fetching workflows
- [ ] Unit tests for WorkflowSwitcher component

---

## Notes

Use `workflow.list` query with `status: "active"` filter.

Use shadcn/ui `Select` or `DropdownMenu` component.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
