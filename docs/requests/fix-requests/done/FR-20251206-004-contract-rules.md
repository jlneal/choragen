# Fix Request: Add Contract Enforcement Lint Rules

**ID**: FR-20251206-004  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

We have `require-design-contract` but lack rules that ensure contract conditions are meaningful. Trivial preconditions/postconditions provide no runtime guarantees.

---

## Missing Rules (3)

| Rule | Purpose |
|------|---------|
| `require-postcondition-semantics` | Postconditions must check meaningful properties |
| `require-precondition-semantics` | Preconditions must validate meaningful inputs |
| `no-trivial-contract-conditions` | Contract conditions can't be always-true |

---

## Acceptance Criteria

- [x] All 3 rules implemented
- [x] Rules exported and added to configs
- [x] Rules have ADR reference comments
- [x] `pnpm build` passes
- [x] `pnpm lint` passes

---

## Notes

Examples of trivial conditions to catch:
```typescript
// Bad - always true
preconditions: [() => true]
postconditions: [() => true]

// Bad - no actual validation
preconditions: [(req) => !!req]

// Good - meaningful validation
preconditions: [(req) => req.body?.userId != null]
```

---

## Completion Notes

**Completed**: 2025-12-06  
**Chain**: CHAIN-008-contract-rules (4 tasks)

### Rules Added (3)

1. **require-postcondition-semantics** - Postconditions must check meaningful response properties
2. **require-precondition-semantics** - Preconditions must validate meaningful request properties
3. **no-trivial-contract-conditions** - Catches always-true conditions

### Verification

```
✅ pnpm build - passes
✅ pnpm lint - passes  
✅ pnpm test - passes (32 tests)
```

### Rule Count

- Before: 26 rules
- After: 29 rules (+3)
