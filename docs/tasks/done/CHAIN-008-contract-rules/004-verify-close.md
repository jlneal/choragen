# Task: Verify all and close FR

**Chain**: CHAIN-008-contract-rules  
**Task**: 004-verify-close  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Verify all 3 contract rules work, run full validation, and close FR-20251206-004.

---

## Expected Files

- `Update:`
- `docs/requests/fix-requests/done/FR-20251206-004-contract-rules.md`

---

## Acceptance Criteria

- [ ] pnpm build passes
- [ ] pnpm lint passes (or violations documented)
- [ ] All 3 rules are exported and configured
- [ ] FR moved to done/ with completion notes

---

## Notes

**Commands to run**:
```bash
pnpm build
pnpm lint
```

**Summary of rules added**:
1. require-postcondition-semantics
2. require-precondition-semantics
3. no-trivial-contract-conditions

Move FR and add completion notes.
