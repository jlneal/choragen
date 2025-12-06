# Task: Add require-meaningful-test-coverage rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 007-meaningful-test-coverage  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures tests cover the design intents specified in their `@design-doc`.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-meaningful-test-coverage.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks test covers acceptance criteria from design doc
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-meaningful-test-coverage.mjs`

**Key logic**:
1. Read `@design-doc` from test file
2. Parse acceptance criteria from design doc
3. Check if test file has assertions related to criteria
4. Warn if criteria appear uncovered

This is a heuristic rule - may have false positives.

**Verification**:
```bash
pnpm build
```
