# Task: Add "discarded" to WorkflowStatus Type

**Chain**: CHAIN-071-ideation-workflow  
**Task**: T001  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add "discarded" as a new workflow status to support the ideation workflow's discard path. This status is distinct from "cancelled" — discarded means an idea was explored and rejected; cancelled means a workflow was stopped mid-execution.

---

## Context

The ideation workflow needs a way to end workflows when an idea is rejected during exploration. The current WorkflowStatus enum only has: active, paused, completed, failed, cancelled.

Design doc: `docs/design/core/features/ideation-workflow.md`
CR: `docs/requests/change-requests/doing/CR-20251212-003-ideation-workflow.md`

---

## Expected Files

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/manager.ts` (if status transitions need updating)

---

## Acceptance Criteria

- [ ] "discarded" added to WorkflowStatus type
- [ ] "discarded" added to WORKFLOW_STATUSES array
- [ ] WorkflowManager supports transitioning to "discarded" status
- [ ] Build passes (`pnpm build`)
- [ ] Existing tests pass (`pnpm --filter @choragen/core test`)

---

## Constraints

- Must be backward compatible — existing workflows should not be affected
- Follow existing type patterns in `packages/core/src/workflow/types.ts`

---

## Notes

This is a foundational task that other tasks depend on. The discard status will be used by the gate handling in T003.
