# Task: Add test quality ESLint rules

**Chain**: CHAIN-003-complete-enforcement  
**Task**: 002-test-quality-rules  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rules that enforce test quality. These rules ensure tests are meaningful and not just boilerplate.

---

## Expected Files

- `Create in packages/eslint-plugin/src/rules/:`
- `no-trivial-assertions.ts - Catch meaningless assertions`
- `require-test-assertions.ts - Tests must have assertions`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts`
- `packages/eslint-plugin/src/index.ts`

---

## Acceptance Criteria

- [ ] no-trivial-assertions rule implemented
- [ ] require-test-assertions rule implemented
- [ ] Rules exported and added to configs
- [ ] pnpm build passes
- [ ] Rules have ADR reference comments

---

## Notes

**no-trivial-assertions**:
- Catches: `expect(true).toBe(true)`, `expect(1).toBe(1)`
- Catches: `expect(x).toBe(x)` (same variable)
- Catches: `expect(arr.length).toBeGreaterThan(-1)`

**require-test-assertions**:
- Each `it()` or `test()` block must have at least one `expect()`
- Warns on empty test bodies
- Warns on tests with only setup, no assertions

Reference: `/Users/justin/Projects/itinerary-planner/eslint/rules/no-trivial-assertions.mjs`
