# Task: Add require-test-for-component rule

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 004-test-for-component  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures React components have corresponding test files.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-test-for-component.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks `components/**/*.tsx` files have tests
- [ ] Looks for test file in `__tests__/` or colocated
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-test-for-component.mjs`

**Key logic**:
1. Only runs on `components/**/*.tsx` files
2. Checks for corresponding test file
3. Reports if no test file found

**Note**: This rule is for React projects. Choragen has no React components currently, but the rule should be available for projects that do.

**Verification**:
```bash
pnpm build
```
