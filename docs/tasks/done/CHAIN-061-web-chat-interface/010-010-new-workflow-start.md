# Task: Implement new workflow creation from chat (intent-based and backlog CR selection)

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 010-010-new-workflow-start  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Implement the "new workflow" experience in the chat interface. Users can start a workflow by typing intent (natural language) or by selecting an existing backlog CR.

---

## Expected Files

- `packages/web/src/components/chat/new-workflow-view.tsx — Empty state / new workflow UI`
- `packages/web/src/components/chat/backlog-selector.tsx — CR selection from backlog`
- `Update packages/web/src/app/chat/page.tsx — Show new workflow view when no active workflow`

---

## Acceptance Criteria

- [ ] /chat with no active workflow shows NewWorkflowView
- [ ] User can type intent in input area to start workflow
- [ ] Submitting intent calls workflow.create with generated request
- [ ] BacklogSelector shows list of backlog CRs
- [ ] Selecting a CR starts workflow for that request
- [ ] After creation, redirects to /chat/[workflowId]
- [ ] Loading state during workflow creation
- [ ] Error handling for creation failures
- [ ] Unit tests for NewWorkflowView and BacklogSelector

---

## Notes

Use `backlog.list` query to fetch backlog CRs.

The `workflow.create` mutation requires `requestId` and `template` (use "standard").

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
