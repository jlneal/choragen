# Task: Add require-adr-relevance rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 006-adr-relevance  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that validates ADR references in source files are relevant to the file's purpose.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-adr-relevance.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks ADR reference matches file context
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-adr-relevance.mjs`

**Key logic**:
1. Find ADR reference in file (e.g., `// ADR: ADR-002-governance-schema`)
2. Check if ADR topic relates to file path/content
3. Warn if ADR seems unrelated

This is a heuristic rule - may need tuning.

**Verification**:
```bash
pnpm build
```
