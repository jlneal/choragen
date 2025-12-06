# Task: Add no-trivial-contract-conditions rule

**Chain**: CHAIN-008-contract-rules  
**Task**: 003-no-trivial-conditions  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add ESLint rule that catches trivial contract conditions that are always true and provide no runtime guarantees.

---

## Expected Files

Create:
- `packages/eslint-plugin/src/rules/no-trivial-contract-conditions.ts`

Update:
- `packages/eslint-plugin/src/rules/index.ts` - Export rule
- `packages/eslint-plugin/src/index.ts` - Add to configs

---

## Acceptance Criteria

- [ ] Rule implemented
- [ ] Catches `() => true` patterns
- [ ] Catches `() => !!x` patterns (double negation)
- [ ] Catches empty function bodies
- [ ] Rule exported and added to configs
- [ ] ADR reference comment included
- [ ] `pnpm build` passes

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/eslint/rules/no-trivial-contract-conditions.mjs`

**Trivial patterns to catch**:
- `() => true`
- `() => false` (always fails)
- `(x) => !!x` (double negation without property access)
- `() => {}` (empty body, returns undefined)
- `() => 1` (truthy literal)

**Not trivial** (should pass):
- `(req) => req.body?.id != null`
- `(res) => res.status === 200`
- `(req) => validateSchema(req.body)`

**Verification**:
```bash
pnpm build
```
