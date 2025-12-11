# Task: Agent Runtime Integration

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T006  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Integrate workflow context into agent sessions so they receive stage-scoped tools.

---

## Context

Agent sessions need to know which workflow stage they're operating in so the ToolRegistry can filter appropriately. This connects the workflow layer to the existing agent runtime.

---

## Expected Files

- `packages/cli/src/runtime/session.ts` (modify)
- `packages/cli/src/runtime/context.ts` (modify or create)

---

## Acceptance Criteria

- [x] `runAgentSession` accepts optional workflowId and stageIndex parameters
- [x] Session context includes current stage type when workflow is active
- [x] ToolRegistry receives stage context for filtering
- [x] Sessions without workflow context work as before (no stage filtering)
- [x] Session messages are recorded to workflow message history
- [x] Unit tests for workflow-aware sessions

---

## Constraints

- Must be backward compatible (sessions without workflow still work)
- Don't duplicate workflow state in session (reference by ID)

---

## Notes

The session should:
1. Load workflow state at start
2. Verify it's on the expected stage
3. Pass stage type to ToolRegistry
4. Record messages to workflow history
5. Not advance stages (that's WorkflowManager's job)

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/cli/src/runtime/context.ts` — Workflow session context loader
- `packages/cli/src/runtime/__tests__/workflow-session.test.ts` — Integration tests for stage filtering and message recording

Files updated:
- `packages/cli/src/runtime/session.ts` — Added workflow metadata to session persistence
- `packages/cli/src/runtime/loop.ts` — Accept workflowId/stageIndex, validate stage, filter tools by stage, record messages to workflow history

Features:
- Workflow stage validation at session start
- Stage-scoped tool filtering via ToolRegistry
- Automatic message recording to workflow history
- Backward compatible (sessions without workflow work as before)
