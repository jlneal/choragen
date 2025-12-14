# Task: Implement Post-Commit Gate

**Chain**: CHAIN-074-commit-audit  
**Task**: 003  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement a post-commit gate that fires after `git:commit` tool completes, triggering automatic audit chain creation.

---

## Context

The standard workflow has a commit stage (Stage 6). The post-commit gate:
1. Fires after `git:commit` tool completes
2. Triggers automatic audit chain creation with commit metadata
3. Does not block workflow progression (async audit)

This is a new gate type that differs from existing gates (`human_approval`, `chain_complete`, `verification_pass`) in that it's a hook-style trigger rather than a blocking gate.

Reference: `@/Users/justin/Projects/choragen/docs/design/core/features/standard-workflow.md:179-191`

---

## Expected Files

- `packages/core/src/workflow/gates/post-commit.ts` (new)
- `packages/core/src/workflow/gates/index.ts` (update exports)

---

## Acceptance Criteria

- [ ] `PostCommitGate` class or function implemented
- [ ] Gate receives commit metadata: SHA, message, author, filesChanged
- [ ] Gate triggers audit chain creation asynchronously
- [ ] Gate does not block workflow progression
- [ ] Gate is configurable (can be disabled in workflow template)
- [ ] Exports updated in gates index
- [ ] Unit tests for gate behavior

---

## Constraints

- Must integrate with existing workflow gate system
- Must not block the commit stage from completing
- Audit chain creation should be fire-and-forget from the gate's perspective

---

## Notes

The gate should emit an event or call a service to create the audit chain. The actual chain execution happens independently of the main workflow.
