# Task: Create WorkflowCard component with status, stage, and activity display

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 002-workflow-card  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the WorkflowCard component that displays workflow summary information in the history list. Shows request ID, current stage, status badge, and last activity timestamp.

---

## Expected Files

- `packages/web/src/components/chat/workflow-card.tsx` — WorkflowCard component
- `packages/web/src/__tests__/components/chat/workflow-card.test.tsx` — Tests

---

## Acceptance Criteria

- [ ] WorkflowCard displays request ID prominently
- [ ] Shows current stage name with progress indicator
- [ ] Status badge with color coding (active=blue, paused=yellow, completed=green, cancelled=red)
- [ ] Last activity time shown as relative time (e.g., "2 hours ago")
- [ ] Card is clickable and navigates to workflow chat
- [ ] Hover state provides visual feedback

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
