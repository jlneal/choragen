# Task: LockManager unit tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 003-lock-manager-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create comprehensive unit tests for LockManager, the coordination primitive for parallel chains.

---

## Expected Files

- `Create: packages/core/src/locks/__tests__/lock-manager.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/file-locking.md
- [ ] Uses HttpStatus enum from @choragen/contracts (no magic numbers)
- [ ] Tests lock acquisition (acquireLock)
- [ ] Tests lock release (releaseLock)
- [ ] Tests lock checking (checkLock, isLocked)
- [ ] Tests pattern matching for locked files
- [ ] Tests lock conflicts (same pattern, different chain)
- [ ] Tests lock file persistence (.choragen.lock)
- [ ] Tests error cases (already locked, missing lock, etc.)
- [ ] All tests pass: pnpm --filter @choragen/core test

---

## Notes

Use temp directories for file system tests. Clean up after each test.
