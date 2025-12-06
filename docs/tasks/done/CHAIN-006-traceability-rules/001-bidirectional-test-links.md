# Task: Add require-bidirectional-test-links rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 001-bidirectional-test-links  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that enforces bidirectional links between test files and design docs. When a test has `@design-doc`, the design doc must link back to the test in its "Acceptance Tests" section.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-bidirectional-test-links.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks test files for @design-doc metadata
- [ ] Verifies design doc has "Acceptance Tests" section
- [ ] Verifies design doc links back to test file
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-bidirectional-test-links.mjs`

**Key logic**:
1. Only runs on test files (`*.test.ts`)
2. Looks for `@design-doc <path>` in first 20 lines
3. Reads the design doc file
4. Checks for `## Acceptance Tests` section
5. Checks if test file is referenced in that section

**Messages**:
- `missingBacklink`: Design doc doesn't link back to test
- `missingAcceptanceSection`: Design doc missing Acceptance Tests section

**Options**:
```typescript
{
  requireAcceptanceSection: boolean // default: true
}
```

**Verification**:
```bash
pnpm build
```
