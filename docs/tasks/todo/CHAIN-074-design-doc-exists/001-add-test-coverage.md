# Task: Add Test Coverage for Design Doc Existence Check

**Chain**: CHAIN-074-design-doc-exists  
**Task**: 001-add-test-coverage  
**Type**: impl  
**Status**: done  
**CR**: CR-20251214-004

---

## Objective

Add comprehensive test coverage for the `designDocNotFound` error case in the `require-design-contract` rule.

## Context

The `require-design-contract` rule already validates that `designDoc` paths exist on disk (lines 218-236 in `require-design-contract.ts`). However, there are no tests for this functionality.

## Acceptance Criteria

- [x] Test case for valid design doc path (file exists)
- [x] Test case for invalid design doc path (file does not exist)
- [x] Test case for `validateDesignDocExists: false` option (skips check)
- [x] Tests use mock filesystem or temporary files

## Implementation Summary

Added `createTempProject()` helper that creates temporary directories with `package.json` and optionally a design doc file. Test `"should validate existence of referenced design docs"` covers all three scenarios using real filesystem fixtures with cleanup via `afterEach`.

## Implementation Notes

The existing test file is at `packages/eslint-plugin/src/__tests__/rules.test.ts`.

The rule uses `existsSync` from `node:fs` to check file existence. Tests will need to either:
1. Use actual temporary files
2. Mock the filesystem
3. Reference known existing/non-existing paths

## Files to Modify

- `packages/eslint-plugin/src/__tests__/rules.test.ts`

## Verification

```bash
pnpm --filter @choragen/eslint-plugin test
```
