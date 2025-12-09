# Change Request: ADR Reference Enforcement

**ID**: CR-20251209-001  
**Domain**: tooling  
**Status**: done  
**Created**: 2025-12-09  
**Owner**: control-agent  

---

## Summary

Change the ADR reference validation from warning-level to error-level enforcement, ensuring all source files have ADR references before commits are accepted.

---

## Motivation

Currently, the `validate-source-adr-references.mjs` script warns about missing ADR references but allows commits to proceed. This weakens traceability enforcement and allows technical debt to accumulate.

All validation rules should be error-level to maintain strict governance and ensure every source file is traceable to an architecture decision.

---

## Scope

**In Scope**:
- Update `validate-source-adr-references.mjs` to exit with error code when files are missing ADR references
- Review other validation scripts for similar warning-vs-error inconsistencies
- Ensure pre-commit hook fails on any validation warning

**Out of Scope**:
- Adding new validation rules
- Changing ADR reference format

---

## Proposed Changes

1. Modify `scripts/validate-source-adr-references.mjs`:
   - Change from warning to error when files lack ADR references
   - Exit with code 1 if any files are missing references (excluding exempt files)

2. Review and update if needed:
   - Other validation scripts that may use warnings instead of errors
   - Pre-commit hook behavior

---

## Acceptance Criteria

- [x] `validate-source-adr-references.mjs` exits with error (code 1) when files lack ADR references
- [x] Pre-commit hook blocks commits with missing ADR references
- [x] Exempt files mechanism still works correctly
- [x] All existing source files pass validation (no regressions)
- [x] `pnpm build` passes
- [x] CI pipeline passes

---

## Dependencies

None

---

## Linked Design Documents

- [Development Pipeline](../../design/DEVELOPMENT_PIPELINE.md)

---

## Completion Notes

**Completed**: 2025-12-09  
**Chain**: Skipped — single-line fix, <5 lines changed

### Summary

Changed `scripts/validate-source-adr-references.mjs` line 474 from `process.exit(0)` to `process.exit(1)` when files are missing ADR references. Also changed the output from yellow warning (⚠️) to red error (❌).

---

## Commits

[Populated by `choragen request:close`]
