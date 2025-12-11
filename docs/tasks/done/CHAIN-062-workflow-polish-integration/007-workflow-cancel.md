# Task: Add workflow cancellation with confirmation dialog

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 007-workflow-cancel  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add ability to cancel an active workflow with a confirmation dialog to prevent accidental cancellation.

---

## Expected Files

- `packages/web/src/components/chat/workflow-actions.tsx — Action buttons component`
- `packages/web/src/components/chat/cancel-dialog.tsx — Confirmation dialog`
- `packages/web/src/server/routers/workflow.ts — Add workflow.cancel mutation`
- `packages/web/src/__tests__/components/chat/workflow-cancel.test.tsx — Tests`

---

## Acceptance Criteria

- [ ] Cancel button visible in workflow header/sidebar for active workflows
- [ ] Clicking cancel opens confirmation dialog
- [ ] Dialog explains consequences of cancellation
- [ ] Confirm cancels workflow and updates status
- [ ] Cancelled workflow shows in history with cancelled status
- [ ] Cancel not available for already completed/cancelled workflows

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
