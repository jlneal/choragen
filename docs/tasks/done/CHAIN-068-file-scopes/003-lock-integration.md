# Task: Integrate file scopes with lock acquisition

**Chain**: CHAIN-068-file-scopes  
**Task**: 003-lock-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Integrate file scopes with the existing lock system. When a chain starts, it should automatically acquire locks for its file scope patterns. Lock conflicts should be detected before spawning chains, not at runtime. This enables safe parallel execution.

---

## Expected Files

- `packages/core/src/locks/lock-manager.ts — Add method to acquire locks from chain file scope`
- `packages/core/src/locks/__tests__/lock-manager.test.ts — Tests for scope-based lock acquisition`
- `packages/core/src/tasks/chain-manager.ts — Add method to acquire locks for chain`

---

## Acceptance Criteria

- [ ] LockManager.acquireForScope(chainId, fileScope) acquires locks for all patterns in scope
- [ ] LockManager.checkScopeConflicts(fileScope) returns any existing locks that conflict
- [ ] ChainManager.acquireLocks(chainId) uses chain's fileScope to acquire locks
- [ ] Lock acquisition fails fast if any pattern conflicts with existing lock
- [ ] Tests verify lock/scope integration
- [ ] Existing lock tests continue to pass

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
