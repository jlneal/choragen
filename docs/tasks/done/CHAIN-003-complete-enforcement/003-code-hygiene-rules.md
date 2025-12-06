# Task: Add code hygiene ESLint rules

**Chain**: CHAIN-003-complete-enforcement  
**Task**: 003-code-hygiene-rules  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rules that enforce code hygiene. These rules prevent common mistakes and ensure consistent code quality.

---

## Expected Files

- `Create in packages/eslint-plugin/src/rules/:`
- `require-eslint-disable-justification.ts - eslint-disable needs comment`
- `max-eslint-disables-per-file.ts - Limit eslint-disable usage`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts`
- `packages/eslint-plugin/src/index.ts`

---

## Acceptance Criteria

- [ ] require-eslint-disable-justification rule implemented
- [ ] max-eslint-disables-per-file rule implemented
- [ ] Rules exported and added to configs
- [ ] pnpm build passes
- [ ] Rules have ADR reference comments

---

## Notes

**require-eslint-disable-justification**:
- Requires comment explaining why rule is disabled
- Valid: `// eslint-disable-next-line no-console -- Debug logging for development`
- Invalid: `// eslint-disable-next-line no-console`

**max-eslint-disables-per-file**:
- Default limit: 5 per file
- Configurable via options
- Encourages fixing issues rather than disabling

Reference: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-eslint-disable-justification.mjs`
