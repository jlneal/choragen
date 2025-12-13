# Task: Chain Lifecycle Tools

**Chain**: CHAIN-068-agent-tools  
**Task**: T002-chain-lifecycle-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the chain lifecycle tools: `chain:approve` and `chain:request_changes`.

---

## Context

The Standard Workflow requires chain-level review after all tasks in a chain are complete. Per ADR-013:
- `chain:approve` marks chain as approved, emits `chain.approved` event
- `chain:request_changes` requests changes on chain, emits `chain.changes_requested` event

These tools are used by the Review agent role.

---

## Expected Files

- `packages/cli/src/runtime/tools/chain-tools.ts` (create or extend)
- `packages/cli/src/runtime/tools/__tests__/chain-tools.test.ts`

---

## Acceptance Criteria

- [ ] `chain:approve` tool implemented with parameters: `{ chainId, reason? }`
- [ ] `chain:approve` emits `chain.approved` event
- [ ] `chain:request_changes` tool implemented with parameters: `{ chainId, reason }`
- [ ] `chain:request_changes` emits `chain.changes_requested` event
- [ ] Both tools registered in ToolRegistry with `review` role access
- [ ] Unit tests for both tools

---

## Constraints

- Must integrate with existing ChainManager if one exists
- Tools should only be accessible to review role

---

## Notes

Review the existing `chain:status` tool for patterns.

---

## Completion Summary

Implemented chain lifecycle tooling and wiring:

- Added `chain:approve` and `chain:request_changes` tools in `packages/cli/src/runtime/tools/chain-tools.ts`
- Validates chain existence via ChainManager before emitting events
- Emits `chain.approved` and `chain.changes_requested` events
- Registered executors and exports in executor.ts, registry.ts, index.ts
- Updated stage permissions for review access in `packages/core/src/workflow/stage-tools.ts`
- Added unit tests in `packages/cli/src/runtime/tools/__tests__/chain-tools.test.ts`
