# Task: Verify all and close FR

**Chain**: CHAIN-009-code-hygiene-rules  
**Task**: 006-verify-close  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Verify all 5 code hygiene rules work, run full validation, and close FR-20251206-005.

---

## Expected Files

Update:
- `docs/requests/fix-requests/done/FR-20251206-005-code-hygiene-rules.md`

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
1. require-error-handler
2. require-try-catch-in-async
3. require-error-boundary
4. max-eslint-disables-ratio
5. require-readonly-properties

Move FR and add completion notes.
