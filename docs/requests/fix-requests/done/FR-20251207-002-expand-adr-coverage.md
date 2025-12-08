# Fix Request: Expand ADR Reference Coverage to All Executable Artifacts

**ID**: FR-20251207-002  
**Domain**: core  
**Status**: done  
**Severity**: medium  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

The current ADR reference validation (Rule 6: Source → ADR) only covers `packages/*/src/**`. This misses other artifacts that "do something":

- `.github/workflows/*.yml` — CI/CD pipelines
- `scripts/*.mjs` — Validation and utility scripts
- `eslint.config.mjs` — Linting configuration
- `tsconfig.json` — TypeScript configuration
- `githooks/*` — Git hooks

These artifacts embody technical decisions but aren't required to reference the ADRs that govern them.

---

## Impact

- **Traceability gap** — Can't trace "why does CI work this way?" back to a decision
- **Inconsistency** — Some executable code requires ADR refs, some doesn't
- **Principle violation** — "If it does something, it should trace to a decision"

---

## Proposed Fix

1. Expand `validate-source-adr-references.mjs` to cover additional patterns
2. Add exemption mechanism for files that legitimately don't need ADRs
3. Ensure existing scripts/configs have ADR references (or create ADRs)

---

## Affected Files

- `scripts/validate-source-adr-references.mjs`
- `.github/workflows/*.yml` (will need ADR refs)
- `scripts/*.mjs` (verify existing refs)
- `eslint.config.mjs`, `tsconfig.json`, etc.

---

## Acceptance Criteria

- [x] Validator covers: `.github/workflows/*.yml`, `scripts/*.mjs`, `*.config.mjs`, `githooks/*`
- [x] Exemption patterns configurable in `choragen.governance.yaml`
- [x] All covered files either have ADR refs or are explicitly exempted
- [x] Validator passes

---

## Completion Notes

**Completed**: 2025-12-07

### Implementation Summary

Expanded `validate-source-adr-references.mjs` to enforce the principle: "If it does something, it should trace to a decision."

**New File Types Covered**:
- `scripts/*.mjs` — 16 files (14 with refs, 2 exempted)
- `eslint.config.mjs` — 1 file with ref
- `githooks/*` — 3 files with refs
- `.github/workflows/*.yml` — Ready when CI is created

**Exemption Support**:
- Added `validation.source-adr-references.exempt-patterns` to `choragen.governance.yaml`
- Exempted utility scripts (`run.mjs`, `run-validators.mjs`) with justification

**Validation Results**:
```
ADR Reference Coverage: 100%
  Total files checked: 71
  With ADR references: 69
  Missing references: 0
  Exempt files: 2
```

### Chain

Implemented via CHAIN-026-expand-adr-coverage (skipDesign - extending existing pattern)
