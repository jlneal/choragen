# Task: Verify all and close FR

**Chain**: CHAIN-010-validation-scripts  
**Task**: 008-verify-close  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Verify all 8 validation scripts work, run full validation, and close FR-20251206-006.

---

## Expected Files

Update:
- `docs/requests/fix-requests/done/FR-20251206-006-validation-scripts.md`

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm validate:all` runs all scripts
- [ ] All scripts produce useful output
- [ ] FR moved to done/ with completion notes

---

## Notes

**Commands to run**:
```bash
pnpm build
pnpm validate:all
```

**Summary of scripts added**:
1. validate-complete-traceability
2. validate-test-coverage
3. validate-design-doc-content
4. validate-contract-coverage
5. validate-adr-staleness
6. validate-request-staleness
7. validate-request-completion
8. validate-source-adr-references

Move FR and add completion notes.
