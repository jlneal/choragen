# Task: Add require-test-for-lib-export rule

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 005-test-for-lib-export  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures lib exports have corresponding test files.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-test-for-lib-export.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks `lib/**/*.ts` files with exports have tests
- [ ] Looks for test file in `lib/__tests__/` or colocated
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-test-for-lib-export.mjs`

**Key logic**:
1. Only runs on `lib/**/*.ts` files
2. Checks if file has exports
3. Checks for corresponding test file
4. Reports if exported module has no tests

**This rule is highly relevant for choragen** since it's a library project.

**Verification**:
```bash
pnpm build
```
