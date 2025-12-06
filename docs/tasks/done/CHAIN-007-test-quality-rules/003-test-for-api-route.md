# Task: Add require-test-for-api-route rule

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 003-test-for-api-route  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures API routes have corresponding test files.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-test-for-api-route.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks app/api/**/route.ts files have tests
- [ ] Looks for test file in __tests__/api/ or colocated
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-test-for-api-route.mjs`

**Key logic**:
1. Only runs on `app/api/**/route.ts` files
2. Checks for corresponding test file
3. Reports if no test file found

**Note**: This rule is for Next.js API routes. Choragen has no API routes currently, but the rule should be available for projects that do.

**Verification**:
```bash
pnpm build
```
