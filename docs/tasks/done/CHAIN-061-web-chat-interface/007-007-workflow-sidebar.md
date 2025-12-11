# Task: Create WorkflowSidebar showing stage progress, artifacts, and metrics

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 007-007-workflow-sidebar  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the WorkflowSidebar component that displays alongside the chat, showing workflow progress, stage information, artifacts created, and basic metrics.

---

## Expected Files

- `packages/web/src/components/chat/workflow-sidebar.tsx — Main sidebar component`
- `packages/web/src/components/chat/stage-list.tsx — Stage progress list`
- `packages/web/src/components/chat/artifact-list.tsx — Artifacts created in workflow`

---

## Acceptance Criteria

- [ ] WorkflowSidebar renders in right column of chat layout
- [ ] Shows "Workflow Progress" section with StageList
- [ ] StageList shows all stages with current stage highlighted
- [ ] Progress indicator shows completion percentage
- [ ] Shows "Artifacts" section listing artifacts created during workflow
- [ ] Artifacts are clickable links to detail pages
- [ ] Shows basic metrics (messages count, duration, etc.)
- [ ] Sidebar collapses on mobile or narrow screens
- [ ] Unit tests for WorkflowSidebar component

---

## Notes

Workflow data from `workflow.get` includes `stages` array with `{ name, type, status }` and `currentStageIndex`.

Use existing patterns from session components for layout.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
