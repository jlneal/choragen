# Task: Chain Completion Validation Runner

**Chain**: CHAIN-076-chain-completion-gate  
**Task**: 002-validation-runner  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement the validation runner that executes chain completion checks. This is the core logic that runs each validation check and aggregates results.

---

## Context

With types defined in task 001, this task implements the actual validation logic:
- Task state check: verify all tasks are in `done/` directory
- Completion notes check: verify task files have completion notes section filled
- Acceptance criteria check: verify checkboxes are checked in task files
- Design doc update check: if chain scope includes design docs, verify git shows modifications
- Test coverage check: if chain has impl tasks, verify test files exist for modified source files

The runner should be configurable and produce actionable feedback on failures.

---

## Expected Files

- `packages/core/src/chain/validation-runner.ts`
- `packages/core/src/chain/__tests__/validation-runner.test.ts`

---

## Acceptance Criteria

- [ ] `runChainValidation(chain, config)` function executes all configured checks
- [ ] Each check produces a `ChainValidationResult` with pass/fail and feedback
- [ ] Failed validations include actionable messages (e.g., "Task 001-setup missing completion notes")
- [ ] Checks can be enabled/disabled via config
- [ ] Runner handles missing files gracefully (reports as failure, not exception)
- [ ] Unit tests cover each validation check type

---

## Constraints

- Use existing `TaskParser` for reading task files
- Use `globMatch` from utils for file scope matching
- Keep checks independent — one failing check shouldn't prevent others from running

---

## Notes

The validation runner is called from the `onComplete` chain hook. It should be fast and not require network calls.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
