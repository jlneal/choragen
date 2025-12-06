# Task: Add require-try-catch-in-async rule

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 002-try-catch-async  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that requires try/catch blocks in async functions.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-try-catch-in-async.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Requires try/catch in async functions
- [ ] Allows .catch() as alternative
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-try-catch-in-async.mjs`

**Note**: This may overlap with `require-error-handler`. Consider if both are needed or if one is sufficient.

**Verification**:
```bash
pnpm build
```
