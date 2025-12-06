# Task: Verify all and close FR

**Chain**: CHAIN-007-test-quality-rules  
**Task**: 006-verify-close  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Verify all 5 test quality rules work, run full validation, and close FR-20251206-003.

---

## Expected Files

Update:
- `docs/requests/fix-requests/done/FR-20251206-003-test-quality-rules.md`

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes (or violations documented)
- [ ] All 5 rules are exported and configured
- [ ] FR moved to done/ with completion notes

---

## Notes

**Commands to run**:
```bash
pnpm build
pnpm lint
```

**Summary of rules added**:
1. require-test-exercises-component
2. require-test-exercises-route
3. require-test-for-api-route
4. require-test-for-component
5. require-test-for-lib-export

Move FR and add completion notes.
