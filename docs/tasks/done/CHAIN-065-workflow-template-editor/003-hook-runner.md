# Task: Implement TransitionHookRunner for stage transition automation

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 003-hook-runner  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement a `TransitionHookRunner` class in `@choragen/core` that executes `onEnter` and `onExit` hooks during workflow stage transitions. The runner should:
- Execute `command` actions via shell
- Execute `task_transition` actions (start/complete/approve tasks)
- Execute `file_move` actions (move files between directories)
- Support `custom` action handlers via registry
- Handle `blocking` flag (fail transition if blocking action fails)
- Integrate with `WorkflowManager` to run hooks during `advance()`

This is Phase 1 (continued) of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/core/src/workflow/hook-runner.ts — New TransitionHookRunner class`
- `packages/core/src/workflow/index.ts — Export TransitionHookRunner`
- `packages/core/src/workflow/__tests__/hook-runner.test.ts — Unit tests`
- `packages/core/src/workflow/manager.ts — Integrate hook execution in advance()`

---

## Acceptance Criteria

- [ ] TransitionHookRunner.runOnEnter(stage, context) executes onEnter hooks
- [ ] TransitionHookRunner.runOnExit(stage, context) executes onExit hooks
- [ ] command actions execute shell commands and capture output
- [ ] task_transition actions call TaskManager methods (start/complete/approve)
- [ ] file_move actions move files from source to destination
- [ ] custom actions look up handler in registry and execute
- [ ] blocking: true (default) causes transition to fail if action fails
- [ ] blocking: false logs error but continues transition
- [ ] WorkflowManager.advance() runs onExit hooks before transition, onEnter after
- [ ] Hook execution results are logged/returned for debugging
- [ ] pnpm build and pnpm --filter @choragen/core test pass

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
