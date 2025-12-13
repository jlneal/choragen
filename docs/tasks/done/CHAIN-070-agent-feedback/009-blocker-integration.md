# Task: Integrate Blocker Feedback with Workflow Advancement

**Chain**: CHAIN-070-agent-feedback  
**Task**: 009-blocker-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Integrate blocker-type feedback with workflow advancement logic. When an agent creates a blocker feedback, the workflow should not advance until the blocker is resolved or dismissed.

---

## Expected Files

- `packages/core/src/workflow/WorkflowRunner.ts` - Modify advancement logic
- `packages/core/src/workflow/__tests__/blocker-feedback.test.ts` - Integration tests

---

## File Scope

- MODIFY: `packages/core/src/workflow/WorkflowRunner.ts` (check for unresolved blockers)
- CREATE: `packages/core/src/workflow/__tests__/blocker-feedback.test.ts`
- MODIFY: Workflow state to track blocking feedback IDs

---

## Acceptance Criteria

- [ ] Workflow checks for unresolved blocker feedback before advancing
- [ ] Blocker feedback prevents stage transition until resolved/dismissed
- [ ] Workflow state includes `blockingFeedbackIds` array
- [ ] Resolving blocker allows workflow to continue
- [ ] Dismissing blocker allows workflow to continue
- [ ] Non-blocker feedback does not prevent advancement
- [ ] Integration tests verify blocking behavior

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/core/src/workflow/manager.ts` — Added `ensureNoBlockingFeedback()` check in `advance()`, integrated `FeedbackManager`
- `packages/core/src/workflow/types.ts` — Added `blockingFeedbackIds` to `Workflow` interface
- `packages/core/src/workflow/persistence.ts` — Serialize/revive `blockingFeedbackIds`
- `packages/core/src/workflow/__tests__/blocker-feedback.test.ts` — Integration tests for blocking behavior

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
