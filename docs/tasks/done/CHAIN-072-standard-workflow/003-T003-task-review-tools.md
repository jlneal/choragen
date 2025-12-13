# Task: Implement task:approve and task:request_changes tools

**Chain**: CHAIN-072-standard-workflow  
**Task**: 003-T003-task-review-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement `task:approve` and `task:request_changes` CLI tools for the review agent to approve or request changes on submitted tasks.

---

## Expected Files

- `packages/cli/src/commands/task/approve.ts` — Approve command
- `packages/cli/src/commands/task/request-changes.ts` — Request changes command
- `packages/core/src/task/review.ts` — Core review logic
- `packages/cli/src/commands/task/__tests__/approve.test.ts` — Tests
- `packages/cli/src/commands/task/__tests__/request-changes.test.ts` — Tests

---

## File Scope

- `packages/cli/src/commands/task/**`
- `packages/core/src/task/**`

---

## Acceptance Criteria

- [x] `choragen task:approve <chain-id> <task-id>` moves task from `in-review/` to `done/`
- [x] `choragen task:request_changes <chain-id> <task-id> --reason "..."` moves task back to `in-progress/`
- [x] Approve emits `task:approved` event
- [x] Request changes emits `task:changes_requested` event with reason
- [x] Both commands fail gracefully if task is not in `in-review` state
- [x] Tests cover success and error cases

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
