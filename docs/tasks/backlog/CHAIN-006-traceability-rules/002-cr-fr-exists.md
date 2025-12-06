# Task: Add require-cr-fr-exists rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 002-cr-fr-exists  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that validates CR/FR references in code actually exist as files in `docs/requests/`.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-cr-fr-exists.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Validates CR-YYYYMMDD-NNN references exist
- [ ] Validates FR-YYYYMMDD-NNN references exist
- [ ] Checks in todo/, doing/, done/ directories
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-cr-fr-exists.mjs`

**Key logic**:
1. Find CR/FR references in comments (e.g., `// CR-20251206-001`)
2. Check if file exists at:
   - `docs/requests/change-requests/{todo,doing,done}/CR-*.md`
   - `docs/requests/fix-requests/{todo,doing,done}/FR-*.md`
3. Report error if referenced CR/FR doesn't exist

**Pattern**: `(CR|FR)-\d{8}-\d{3}`

**Verification**:
```bash
pnpm build
```
