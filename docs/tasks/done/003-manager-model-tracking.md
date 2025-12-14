# Task: Update WorkflowManager for Model Tracking

**Chain**: CR-20251214-001  
**Task**: 003  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Update `WorkflowManager` to accept and track model information when adding messages and creating workflows.

---

## Context

With model types in place, the manager needs to:
1. Accept `model` parameter when adding messages
2. Inherit `defaultModel` from template stage when creating workflows
3. Provide current model context for LLM calls

---

## Expected Files

- `packages/core/src/workflow/manager.ts` — Update `addMessage`, `create` methods
- `packages/core/src/workflow/types.ts` — Update `AddMessageOptions` if needed

---

## Acceptance Criteria

- [x] `addMessage` accepts optional `model?: ModelReference` parameter
- [x] Messages store the model that generated them
- [x] `create` copies `defaultModel` from template stages to workflow stages
- [x] `getCurrentModel(workflowId)` method returns active model for current stage
- [x] Existing tests still pass
- [x] `pnpm build` passes
- [x] `pnpm --filter @choragen/core test` passes

---

## Constraints

- Backward compatible — existing workflows without model fields should work
- Model field is optional throughout

---

## Notes

Depends on Task 001 for types.

The actual LLM call integration (passing model to API) will be handled in the web package where the AI SDK is used.
