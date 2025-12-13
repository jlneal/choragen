# Task: Implement task:submit tool for submitting work for review

**Chain**: CHAIN-072-standard-workflow  
**Task**: 002-T002-task-submit-tool  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement the `task:submit` CLI tool that allows an agent to submit a task for review. This moves the task from `in-progress/` to `in-review/` and triggers the review agent spawn hook.

---

## Expected Files

- `packages/cli/src/commands/task/submit.ts` — New CLI command
- `packages/core/src/task/submit.ts` — Core logic for task submission
- `packages/cli/src/commands/task/__tests__/submit.test.ts` — Tests

---

## File Scope

- `packages/cli/src/commands/task/**`
- `packages/core/src/task/**`

---

## Acceptance Criteria

- [x] `choragen task:submit <chain-id> <task-id>` command exists
- [x] Command moves task file from `in-progress/` to `in-review/`
- [x] Command updates task status to `in-review`
- [x] Command emits `task:submitted` event for hook system
- [x] Command fails gracefully if task is not in `in-progress` state
- [x] Tests cover success and error cases

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
