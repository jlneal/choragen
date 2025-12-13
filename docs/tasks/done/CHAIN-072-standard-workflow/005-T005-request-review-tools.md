# Task: Implement request:approve and request:request_changes tools

**Chain**: CHAIN-072-standard-workflow  
**Task**: 005-T005-request-review-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement `request:approve` and `request:request_changes` CLI tools for final review of entire requests after all chains are complete.

---

## Expected Files

- `packages/cli/src/commands/request/approve.ts` — Approve command
- `packages/cli/src/commands/request/request-changes.ts` — Request changes command
- `packages/core/src/request/review.ts` — Core review logic
- `packages/cli/src/commands/request/__tests__/approve.test.ts` — Tests
- `packages/cli/src/commands/request/__tests__/request-changes.test.ts` — Tests

---

## File Scope

- `packages/cli/src/commands/request/**`
- `packages/core/src/request/**`

---

## Acceptance Criteria

- [x] `choragen request:approve <request-id>` marks request as approved
- [x] `choragen request:request_changes <request-id> --reason "..."` marks request for rework
- [x] Approve emits `request:approved` event
- [x] Request changes emits `request:changes_requested` event
- [x] Commands validate all chains for request are approved before allowing request approval
- [x] Tests cover success and error cases

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
