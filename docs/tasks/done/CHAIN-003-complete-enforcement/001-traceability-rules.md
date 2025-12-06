# Task: Add traceability ESLint rules

**Chain**: CHAIN-003-complete-enforcement  
**Task**: 001-traceability-rules  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rules that enforce traceability between code and documentation.
These rules ensure every change can be traced back to a CR/FR.

---

## Expected Files

- `Create in packages/eslint-plugin/src/rules/:`
- `no-untracked-todos.ts - TODOs must reference CR/FR`
- `require-new-file-traceability.ts - New files need CR/FR context`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export new rules`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] no-untracked-todos rule implemented
- [ ] require-new-file-traceability rule implemented
- [ ] Rules exported in index.ts
- [ ] Rules added to recommended/strict configs
- [ ] pnpm build passes
- [ ] Rules have ADR reference comments

---

## Notes

**no-untracked-todos**: 
- Matches TODO, FIXME, HACK comments
- Requires CR-YYYYMMDD-NNN or FR-YYYYMMDD-NNN reference
- Example valid: `// TODO(CR-20251206-002): Add validation`
- Example invalid: `// TODO: fix this later`

**require-new-file-traceability**:
- Only applies to newly created files (heuristic: file has no git history)
- Requires file-level comment with CR/FR reference
- Can be disabled for generated files

Reference implementations in itinerary-planner:
- `/Users/justin/Projects/itinerary-planner/eslint/rules/no-untracked-todos.mjs`
- `/Users/justin/Projects/itinerary-planner/eslint/rules/require-new-file-traceability.mjs`
