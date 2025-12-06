# Task: Add require-precondition-semantics rule

**Chain**: CHAIN-008-contract-rules  
**Task**: 002-precondition-semantics  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that ensures preconditions in DesignContract validate meaningful inputs, not trivial always-true conditions.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/require-precondition-semantics.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Detects trivial preconditions like `() => true`
- [ ] Detects preconditions that don't validate request properties
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/require-precondition-semantics.mjs`

**Key logic**:
1. Find DesignContract calls with preconditions array
2. Check each precondition function body
3. Flag if body is just `true`, `!!req`, or similar trivial checks
4. Good preconditions check: `req.body`, `req.params`, specific properties

**Examples**:
```typescript
// Bad
preconditions: [() => true]
preconditions: [(req) => !!req]

// Good
preconditions: [(req) => req.body?.userId != null]
preconditions: [(req) => typeof req.params.id === 'string']
```

**Verification**:
```bash
pnpm build
```
