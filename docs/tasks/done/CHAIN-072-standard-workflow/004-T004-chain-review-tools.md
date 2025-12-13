# Task: Implement chain:approve and chain:request_changes tools

**Chain**: CHAIN-072-standard-workflow  
**Task**: 004-T004-chain-review-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement `chain:approve` and `chain:request_changes` CLI tools for reviewing entire chains after all tasks are complete.

---

## Expected Files

- `packages/cli/src/commands/chain/approve.ts` — Approve command
- `packages/cli/src/commands/chain/request-changes.ts` — Request changes command
- `packages/core/src/chain/review.ts` — Core review logic
- `packages/cli/src/commands/chain/__tests__/approve.test.ts` — Tests
- `packages/cli/src/commands/chain/__tests__/request-changes.test.ts` — Tests

---

## File Scope

- `packages/cli/src/commands/chain/**`
- `packages/core/src/chain/**`

---

## Acceptance Criteria

- [x] `choragen chain:approve <chain-id>` marks chain as approved
- [x] `choragen chain:request_changes <chain-id> --reason "..."` marks chain for rework
- [x] Approve emits `chain:approved` event
- [x] Request changes emits `chain:changes_requested` event
- [x] Commands validate all tasks in chain are in `done` state before allowing approval
- [x] Tests cover success and error cases

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
