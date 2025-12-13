# Task: Update Workflow UI for Discard Option

**Chain**: CHAIN-071-ideation-workflow  
**Task**: T005  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the workflow chat UI to support the discard gate option, including displaying discard buttons and handling the discard flow with reasoning capture.

---

## Context

The web chat interface needs to:
1. Display "Discard" button alongside "Continue" at exploration gate
2. Handle discard action with reasoning input
3. Show discarded workflow state appropriately
4. Display discard summary in workflow history

Depends on: T003 (discard gate handling)

Design doc: `docs/design/core/features/ideation-workflow.md`
Web chat: `packages/web/src/app/chat/[workflowId]/page.tsx`

---

## Expected Files

- `packages/web/src/components/chat/workflow-actions.tsx`
- `packages/web/src/app/chat/[workflowId]/page.tsx`
- `packages/web/src/app/chat/history/page.tsx` (show discarded workflows)

---

## Acceptance Criteria

- [ ] Gate options from template are rendered as buttons
- [ ] "Discard" button triggers discard flow
- [ ] Discard flow captures reasoning (modal or inline input)
- [ ] Discarded workflows show appropriate status in history
- [ ] Discarded workflow detail shows discard summary
- [ ] Build passes
- [ ] UI is consistent with existing workflow actions

---

## Constraints

- Follow existing UI patterns in workflow-actions.tsx
- Discard should be visually distinct (e.g., different color) from advance
- Reasoning input should be required before confirming discard

---

## Notes

The gate options structure in the template:
```yaml
options:
  - label: Continue
    action: advance
  - label: Discard
    action: discard
```

The UI should dynamically render these options based on the gate configuration.
