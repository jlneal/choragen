# Task: ChainManager unit tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 001-chain-manager-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create comprehensive unit tests for ChainManager, the most complex component in @choragen/core.

---

## Expected Files

- `Create: packages/core/src/tasks/__tests__/chain-manager.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/task-chain-management.md
- [ ] Uses HttpStatus enum from @choragen/contracts (no magic numbers)
- [ ] Tests chain creation (createChain)
- [ ] Tests chain listing (listChains)
- [ ] Tests chain retrieval (getChain)
- [ ] Tests chain type handling (design vs implementation)
- [ ] Tests dependsOn chain linking
- [ ] Tests skipDesign flag behavior
- [ ] Tests error cases (duplicate chain, missing chain, etc.)
- [ ] All tests pass: pnpm --filter @choragen/core test

---

## Notes

Use temp directories for file system tests. Clean up after each test.
