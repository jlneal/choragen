# Task: Add require-readonly-properties rule

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 005-readonly-props  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that encourages readonly properties for immutable data.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-readonly-properties.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Suggests readonly for interface properties
- [ ] Configurable patterns to check
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-readonly-properties.mjs`

**Key logic**:
1. Find interface/type declarations
2. Check if properties could be readonly
3. Suggest adding readonly modifier

**Verification**:
```bash
pnpm build
```
