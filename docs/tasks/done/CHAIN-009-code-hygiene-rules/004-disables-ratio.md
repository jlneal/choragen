# Task: Add max-eslint-disables-ratio rule

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 004-disables-ratio  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that limits eslint-disable comments as a percentage of file lines.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/max-eslint-disables-ratio.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Configurable max ratio (default: 5%)
- [ ] Counts eslint-disable comments vs total lines
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/max-eslint-disables-ratio.mjs`

**Complements**: `max-eslint-disables-per-file` (absolute count)

This rule uses a ratio instead of absolute count, which scales better for large files.

**Verification**:
```bash
pnpm build
```
