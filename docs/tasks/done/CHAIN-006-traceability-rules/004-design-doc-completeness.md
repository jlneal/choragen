# Task: Add require-design-doc-completeness rule

**Chain**: CHAIN-006-traceability-rules  
**Task**: 004-design-doc-completeness  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that enforces design docs have required sections based on their type (scenario, use-case, feature, enhancement).

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-design-doc-completeness.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Checks for required sections based on doc type
- [ ] Features require: Objective, Acceptance Criteria
- [ ] Scenarios require: Context, Steps
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-design-doc-completeness.mjs`

**Required sections by type**:
- **Feature**: Objective, Scope, Acceptance Criteria
- **Scenario**: Context, Actor, Steps
- **Use Case**: Goal, Preconditions, Steps
- **Enhancement**: Current State, Proposed Change

**Verification**:
```bash
pnpm build
```
