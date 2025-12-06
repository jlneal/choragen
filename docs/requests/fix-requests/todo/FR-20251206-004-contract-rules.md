# Fix Request: Add Contract Enforcement Lint Rules

**ID**: FR-20251206-004  
**Domain**: core  
**Status**: todo  
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

- [ ] All 3 rules implemented
- [ ] Rules exported and added to configs
- [ ] Rules have ADR reference comments
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

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

[To be added when moved to done/]
