# Task: Add require-design-doc-chain rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 003-design-doc-chain  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that enforces design docs link to their governing ADRs. Design docs must reference at least one ADR.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-design-doc-chain.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks design doc files in docs/design/
- [ ] Requires ADR reference (e.g., ADR-001-*)
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-design-doc-chain.mjs`

**Key logic**:
1. Only runs on files in `docs/design/**/*.md`
2. Looks for ADR references in content
3. Reports error if no ADR link found

**Verification**:
```bash
pnpm build
```
