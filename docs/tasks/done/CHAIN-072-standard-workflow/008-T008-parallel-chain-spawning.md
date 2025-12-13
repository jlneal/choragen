# Task: Implement parallel chain spawning with scope validation

**Chain**: CHAIN-072-standard-workflow  
**Task**: 008-T008-parallel-chain-spawning  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement parallel chain spawning with file scope validation. Chains with non-overlapping file scopes can run concurrently.

---

## Expected Files

- `packages/core/src/chain/parallel.ts` — Parallel execution logic
- `packages/core/src/chain/scope-validator.ts` — File scope overlap detection
- `packages/cli/src/commands/chain/spawn-agents.ts` — CLI command to spawn agents for chains
- `packages/core/src/chain/__tests__/parallel.test.ts` — Tests
- `packages/core/src/chain/__tests__/scope-validator.test.ts` — Tests

---

## File Scope

- `packages/core/src/chain/**`
- `packages/cli/src/commands/chain/**`

---

## Acceptance Criteria

- [x] Scope validator detects overlapping file scopes between chains
- [x] Chains with non-overlapping scopes can be marked for parallel execution
- [x] `choragen chain:spawn-agents <chain-ids...>` spawns agents for multiple chains
- [x] Parallel execution respects scope constraints
- [x] Tests cover scope overlap detection and parallel spawning

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
