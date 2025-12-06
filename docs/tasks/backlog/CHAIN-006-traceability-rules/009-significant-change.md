# Task: Add require-significant-change-traceability rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 009-significant-change  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that requires significant changes (large files, new features) to have CR/FR traceability.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-significant-change-traceability.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Flags large new files without CR/FR reference
- [ ] Configurable threshold (default: 100 lines)
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-significant-change-traceability.mjs`

**Key logic**:
1. Check if file is new (no git history or recently created)
2. Check file size (lines of code)
3. If > threshold and no CR/FR reference, report error

**Options**:
```typescript
{
  lineThreshold: number // default: 100
}
```

**Verification**:
```bash
pnpm build
```
