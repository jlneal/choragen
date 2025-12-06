# Task: Add require-adr-implementation rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 005-adr-implementation  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that enforces ADRs in `done/` have implementation references - source files that implement the decision.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-adr-implementation.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Only checks ADRs in `docs/adr/done/`
- [ ] Requires "Implementation" section with file references
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-adr-implementation.mjs`

**Key logic**:
1. Only runs on `docs/adr/done/*.md`
2. Looks for `## Implementation` section
3. Checks for file path references in that section
4. Reports error if no implementation refs found

**Verification**:
```bash
pnpm build
```
