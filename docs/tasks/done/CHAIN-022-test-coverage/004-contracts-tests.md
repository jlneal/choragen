# Task: DesignContract unit tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 004-contracts-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create comprehensive unit tests for DesignContract and related utilities in @choragen/contracts.

---

## Expected Files

- `Create: packages/contracts/src/__tests__/design-contract.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/design-contract.md
- [ ] Uses HttpStatus enum (no magic numbers)
- [ ] Tests DesignContract function wrapper creation
- [ ] Tests metadata attachment (designDoc property)
- [ ] Tests isDesignContract helper
- [ ] Tests getDesignContractMetadata helper
- [ ] Tests DesignContractBuilder for advanced use cases
- [ ] Tests ApiError class with HttpStatus
- [ ] Tests error cases (missing designDoc, etc.)
- [ ] All tests pass: pnpm --filter @choragen/contracts test

---

## Notes

May need to add vitest to @choragen/contracts if not already configured.
