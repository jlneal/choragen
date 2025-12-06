# Task: Add require-semantic-user-intent rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 008-semantic-user-intent  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures `@user-intent` metadata is meaningful, not boilerplate.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-semantic-user-intent.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Rejects generic intents like "Test the component"
- [ ] Requires specific, actionable intent
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-semantic-user-intent.mjs`

**Rejected patterns**:
- "Test the function"
- "Verify it works"
- "Check the component"
- Too short (< 20 chars)

**Good examples**:
- "Verify user can create a task chain from a CR"
- "Ensure governance rules block invalid mutations"

**Verification**:
```bash
pnpm build
```
