# Task: Add require-test-exercises-component rule

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 001-test-exercises-component  
**Status**: todo  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures component tests actually render and interact with the component, not just import it.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-test-exercises-component.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks .test.tsx files for render() calls
- [ ] Checks for user interactions (userEvent, fireEvent)
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-test-exercises-component.mjs`

**Key logic**:
1. Only runs on `*.test.tsx` files
2. Checks for `render()` call
3. Checks for interactions or meaningful assertions
4. Reports if test just imports without exercising

**Note**: This rule is primarily for React projects. Choragen has no React components currently, but the rule should be available for projects that do.

**Verification**:
```bash
pnpm build
```
