# Task: Implement Discard Gate Option Handling

**Chain**: CHAIN-071-ideation-workflow  
**Task**: T003  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement the "discard" gate action that transitions a workflow to "discarded" status when an idea is rejected during ideation. This includes capturing the discard reasoning in the workflow history.

---

## Context

The exploration stage gate needs a "discard" option that:
1. Prompts for discard reasoning
2. Logs the reasoning to workflow history
3. Transitions workflow to "discarded" status
4. Ends the workflow cleanly

Depends on: T001 (WorkflowStatus "discarded")

Design doc: `docs/design/core/features/ideation-workflow.md` (see Discard Handling section)

---

## Expected Files

- `packages/core/src/workflow/manager.ts`
- `packages/core/src/workflow/types.ts` (if gate action types need updating)
- `packages/web/src/server/routers/workflow.ts` (API endpoint updates)

---

## Acceptance Criteria

- [ ] Gate action "discard" is recognized and handled
- [ ] Discard action prompts for/captures reasoning
- [ ] Reasoning is logged as a workflow message
- [ ] Workflow transitions to "discarded" status
- [ ] Workflow history shows discard summary
- [ ] Build passes
- [ ] Tests added for discard flow

---

## Constraints

- Must integrate with existing gate handling in WorkflowManager
- Discard reasoning should be stored in workflow messages with appropriate metadata

---

## Notes

The discard flow should:
1. User selects "Discard" option at gate
2. System prompts for reasoning (or accepts reasoning with the action)
3. Ideation agent summarizes why idea was rejected
4. Summary logged to workflow history
5. Workflow ends in "discarded" state
