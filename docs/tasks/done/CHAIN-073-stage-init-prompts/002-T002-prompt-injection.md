# Task: Implement prompt injection in WorkflowManager when stage activates

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 002-T002-prompt-injection  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Inject the stage's `initPrompt` into the agent's context when a workflow stage activates. The prompt should be included in the initial user message or as a separate context block so the agent receives stage-specific instructions.

---

## Expected Files

- `packages/cli/src/runtime/loop.ts — Inject initPrompt from workflowContext.stage.initPrompt into the initial messages`
- `packages/cli/src/runtime/__tests__/loop.test.ts — Add tests verifying initPrompt injection`

---

## File Scope

- `packages/cli/src/runtime/loop.ts`
- `packages/cli/src/runtime/__tests__/loop.test.ts`

---

## Acceptance Criteria

- [x] When workflowContext.stage.initPrompt is defined, it is included in the agent's initial context
- [x] The initPrompt appears after the system prompt but before the initial user message
- [x] If no initPrompt is defined, behavior is unchanged
- [x] Unit tests verify initPrompt is injected when present
- [x] Unit tests verify no injection when initPrompt is absent
- [x] pnpm build passes
- [x] pnpm --filter @choragen/cli test passes

---

## Completion Notes

Injected workflow stage `initPrompt` into the initial chat sequence so it appears right after the system prompt and before the default user kickoff message. Added unit coverage capturing provider call inputs to confirm injection when present and no extra message when absent.

**Files Modified**:
- `packages/cli/src/runtime/loop.ts` — Added initPrompt injection at lines 401-407
- `packages/cli/src/runtime/__tests__/loop.test.ts` — Added 2 tests for initPrompt injection

**Verification**: Build passes, 770 tests pass.
