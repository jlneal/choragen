# Task: Add require-test-exercises-route rule

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 002-test-exercises-route  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures route tests actually call the route handler, not just import it.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-test-exercises-route.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks route test files for actual route calls
- [ ] Checks for HTTP method invocations (GET, POST, etc.)
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-test-exercises-route.mjs`

**Key logic**:
1. Only runs on route test files (`app/api/**/*.test.ts`)
2. Checks for HTTP method calls or route handler invocations
3. Reports if test just imports without calling

**Note**: This rule is for Next.js API routes. Choragen has no API routes currently, but the rule should be available for projects that do.

**Verification**:
```bash
pnpm build
```
