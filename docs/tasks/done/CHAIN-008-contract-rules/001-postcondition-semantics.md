# Task: Add require-postcondition-semantics rule

**Chain**: CHAIN-008-contract-rules  
**Task**: 001-postcondition-semantics  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures postconditions in DesignContract check meaningful properties, not trivial always-true conditions.

---

## Expected Files

- `Create:`
- `packages/eslint-plugin/src/rules/require-postcondition-semantics.ts`
- `Update:`
- `packages/eslint-plugin/src/rules/index.ts - Export rule`
- `packages/eslint-plugin/src/index.ts - Add to configs`

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Detects trivial postconditions like () => true
- [ ] Detects postconditions that don't check response properties
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] pnpm build passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-postcondition-semantics.mjs`

**Key logic**:
1. Find DesignContract calls with postconditions array
2. Check each postcondition function body
3. Flag if body is just `true`, `!!response`, or similar trivial checks
4. Good postconditions check: `response.status`, `response.body`, specific properties

**Examples**:
```typescript
// Bad
postconditions: [() => true]
postconditions: [(res) => !!res]

// Good
postconditions: [(res) => res.status === 200]
postconditions: [(res) => res.body?.id != null]
```

**Verification**:
```bash
pnpm build
```
