# Task: Implement scope collision detection function

**Chain**: CHAIN-068-file-scopes  
**Task**: 002-collision-detection  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create a `hasOverlap(scopeA: string[], scopeB: string[]): boolean` function that detects when two file scopes have overlapping patterns. Use the existing `globMatch` utility for pattern matching. This enables the orchestrator to determine which chains can run in parallel.

---

## Expected Files

- `packages/core/src/tasks/scope-utils.ts — New file with collision detection functions`
- `packages/core/src/tasks/__tests__/scope-utils.test.ts — Tests for collision detection`
- `packages/core/src/index.ts — Export new scope utilities`

---

## Acceptance Criteria

- [ ] hasOverlap(scopeA, scopeB) returns true if any pattern in scopeA matches any pattern in scopeB
- [ ] getOverlappingPatterns(scopeA, scopeB) returns the specific overlapping patterns
- [ ] findConflictingChains(chainId) returns chains with overlapping scopes
- [ ] Handles glob patterns correctly (e.g., packages/core/** overlaps with packages/core/src/foo.ts)
- [ ] Empty scopes never conflict
- [ ] Comprehensive tests for edge cases
- [ ] Functions exported from @choragen/core

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
