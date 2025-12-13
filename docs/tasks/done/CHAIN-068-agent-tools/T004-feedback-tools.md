# Task: Feedback Tools

**Chain**: CHAIN-068-agent-tools  
**Task**: T004-feedback-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the `feedback:create` tool for async human input during workflow execution.

---

## Context

Implementation agents may need human input without blocking the entire workflow. Per ADR-013:
- `feedback:create` creates a FeedbackItem and persists it to the workflow
- Supports blocking mode (workflow pauses) and non-blocking mode (agent continues)
- Emits `feedback.created` event

See `docs/design/core/features/agent-feedback.md` for full design.

---

## Expected Files

- `packages/cli/src/runtime/tools/feedback-tools.ts`
- `packages/cli/src/runtime/tools/__tests__/feedback-tools.test.ts`

---

## Acceptance Criteria

- [ ] `feedback:create` tool implemented with parameters: `{ workflowId, question, context?, blocking? }`
- [ ] FeedbackItem persisted to workflow state
- [ ] `feedback.created` event emitted
- [ ] Blocking mode pauses workflow execution
- [ ] Non-blocking mode allows agent to continue
- [ ] Tool registered with `impl` and `design` role access
- [ ] Unit tests covering both blocking and non-blocking modes

---

## Constraints

- Must integrate with workflow state management
- FeedbackItem must be retrievable by workflow orchestration

---

## Notes

Check `docs/design/core/features/agent-feedback.md` for FeedbackItem schema and behavior details.

---

## Completion Summary

Implemented async feedback tooling:

- Added `feedback:create` tool in `packages/cli/src/runtime/tools/feedback-tools.ts`
- FeedbackItem persisted to `.choragen/workflows/{workflowId}/feedback/{id}.json`
- Blocking mode pauses workflow via `WorkflowManager.updateStatus()`
- Non-blocking mode continues execution, feedback logged for later resolution
- Emits `feedback.created` event with feedbackId, workflowId, blocking flag
- Wired into executor.ts, registry.ts, index.ts
- Stage access enabled for design and implementation stages
- Added unit tests covering both blocking and non-blocking modes
