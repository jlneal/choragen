# Task: Chain Completion Hook Integration

**Chain**: CHAIN-076-chain-completion-gate  
**Task**: 003-hook-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Integrate the chain completion validation into the existing `ChainHooks.onComplete` system. When a chain completes, the validation runner should automatically execute and block completion if validations fail.

---

## Context

The `ChainHooks` interface already has an `onComplete` hook (see `packages/core/src/workflow/types.ts`). This task wires the validation runner into that hook system so that:
1. When `chain:complete` or equivalent is called, validations run
2. If validations fail, the chain completion is blocked with feedback
3. If validations pass, the chain proceeds to complete

This requires adding a new `TransitionAction` type for validation or integrating with the existing hook runner.

---

## Expected Files

- `packages/core/src/chain/completion-gate.ts` (orchestrates validation on chain complete)
- `packages/core/src/hooks/runner.ts` (may need modification to support validation action)
- `packages/core/src/chain/__tests__/completion-gate.test.ts`

---

## Acceptance Criteria

- [ ] Chain completion triggers validation hooks automatically
- [ ] Failed validations block chain completion with actionable feedback
- [ ] Passed validations allow chain to proceed to complete
- [ ] Integration works with existing `ChainHooks.onComplete` pattern
- [ ] Hook runner supports the new validation action type (if needed)
- [ ] Tests verify blocking behavior on validation failure

---

## Constraints

- Maintain backward compatibility — chains without validation config should complete normally
- Don't break existing `TransitionAction` types
- Keep the gate synchronous (no async validation that could timeout)

---

## Notes

Consider whether validation should be a new `TransitionAction` type (`type: "validation"`) or a separate mechanism. The CR suggests a `validation` action type in the YAML config.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
