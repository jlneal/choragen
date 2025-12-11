# Task: Workflow Core Types

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T001  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Define the core TypeScript types for workflow orchestration in `@choragen/core`.

---

## Context

CR-20251210-004 introduces workflow orchestration to enforce process discipline. This task creates the foundational types that all other workflow functionality builds upon.

Reference: `docs/design/core/features/workflow-orchestration.md` and `docs/adr/todo/ADR-011-workflow-orchestration.md`

---

## Expected Files

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/index.ts`
- `packages/core/src/index.ts` (update exports)

---

## Acceptance Criteria

- [x] `Workflow` type captures: id, requestId, template, currentStage, status, stages[], messages[], createdAt, updatedAt
- [x] `WorkflowStage` type captures: name, type, status, chainId?, sessionId?, gate, startedAt?, completedAt?
- [x] `StageGate` type captures: type (auto|human_approval|chain_complete|verification_pass), prompt?, chainId?, commands?, satisfied, satisfiedBy?, satisfiedAt?
- [x] `WorkflowMessage` type captures: id, role, content, stageIndex, timestamp, metadata?
- [x] Stage type enum: "request" | "design" | "review" | "implementation" | "verification"
- [x] Workflow status enum: "active" | "paused" | "completed" | "failed" | "cancelled"
- [x] Stage status enum: "pending" | "active" | "awaiting_gate" | "completed" | "skipped"
- [x] All types exported from `@choragen/core`

---

## Constraints

- Follow existing type patterns in `packages/core/src/tasks/types.ts`
- Use Date for timestamps (not string)
- Include JSDoc comments for all types

---

## Notes

These types are the foundation. Keep them clean and well-documented. The design doc has detailed type definitions to follow.

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/core/src/workflow/types.ts` — All workflow types with JSDoc comments
- `packages/core/src/workflow/index.ts` — Barrel export

File updated:
- `packages/core/src/index.ts` — Added workflow module export

Types implemented:
- Enums: `StageType`, `WorkflowStatus`, `StageStatus`, `GateType`, `MessageRole` (with const arrays)
- Interfaces: `StageGate`, `WorkflowStage`, `WorkflowMessage`, `Workflow`

Verification: `pnpm build`, `pnpm lint`, `pnpm --filter @choragen/core typecheck` all passed.
