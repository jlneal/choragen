# Task: Add template variable support in prompts (requestId, chainId, etc.)

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 003-T003-template-variables  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add template variable substitution to `initPrompt` before injection. Variables like `{{requestId}}`, `{{chainId}}`, `{{workflowId}}`, `{{stageName}}` should be replaced with actual values from the workflow context.

---

## Expected Files

- `packages/cli/src/runtime/loop.ts — Add variable substitution before injecting initPrompt`
- `packages/cli/src/runtime/__tests__/loop.test.ts — Add tests for variable substitution`

---

## File Scope

- `packages/cli/src/runtime/loop.ts`
- `packages/cli/src/runtime/__tests__/loop.test.ts`

---

## Acceptance Criteria

- [x] `{{requestId}}` is replaced with `workflowContext.workflow.requestId`
- [x] `{{workflowId}}` is replaced with `workflowContext.workflow.id`
- [x] `{{chainId}}` is replaced with `chainId` (from config)
- [x] `{{stageName}}` is replaced with `workflowContext.stage.name`
- [x] `{{stageType}}` is replaced with `workflowContext.stage.type`
- [x] Unknown variables are left as-is (no error)
- [x] Unit tests verify each variable substitution
- [x] `pnpm build` passes
- [x] `pnpm --filter @choragen/cli test` passes

---

## Completion Notes

Added `substituteInitPromptVariables` helper function at lines 821-837 in `loop.ts` to resolve workflow variables before injection. Variables `{{requestId}}`, `{{workflowId}}`, `{{chainId}}`, `{{stageName}}`, and `{{stageType}}` are substituted while unknown placeholders remain intact.

**Files Modified**:
- `packages/cli/src/runtime/loop.ts` — Added substituteInitPromptVariables helper and integrated at lines 403-409
- `packages/cli/src/runtime/__tests__/loop.test.ts` — Tests verify variable substitution and unknown placeholder preservation

**Verification**: Build passes, 770 tests pass.
