# Task: Add require-error-boundary rule

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 003-error-boundary  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures React components have error boundaries.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-error-boundary.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks for ErrorBoundary wrapper in component trees
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-error-boundary.mjs`

**Note**: This rule is React-specific. Choragen has no React components currently, but the rule should be available for projects that do.

**Verification**:
```bash
pnpm build
```
