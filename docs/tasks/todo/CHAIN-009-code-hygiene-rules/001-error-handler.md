# Task: Add require-error-handler rule

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 001-error-handler  
**Status**: todo  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures async functions have proper error handling.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-error-handler.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks async functions for try/catch or .catch()
- [ ] Allows error handling via wrapper functions
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-error-handler.mjs`

**Key logic**:
1. Find async functions and arrow functions
2. Check for try/catch blocks
3. Check for .catch() on promises
4. Allow wrapper patterns that handle errors

**Verification**:
```bash
pnpm build
```
