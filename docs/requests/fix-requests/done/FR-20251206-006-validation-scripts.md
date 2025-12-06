# Fix Request: Add Missing Validation Scripts

**ID**: FR-20251206-006  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

We have 4 validation scripts but itinerary-planner has ~15. We're missing key scripts for complete traceability validation.

---

## Current Scripts (4)

- `validate-links.mjs`
- `validate-adr-traceability.mjs`
- `validate-commit-traceability.mjs`
- `validate-agents-md.mjs`

---

## Missing Scripts (~8)

| Script | Purpose |
|--------|---------|
| `validate-complete-traceability` | Full Request → Design → ADR → Code chain |
| `validate-test-coverage` | Design doc ↔ test bidirectional links |
| `validate-design-doc-content` | Required sections in design docs |
| `validate-contract-coverage` | DesignContract usage in routes/handlers |
| `validate-adr-staleness` | Flag stale ADRs in doing/ |
| `validate-request-staleness` | Flag stale requests |
| `validate-request-completion` | Closed requests have completion notes |
| `validate-source-adr-references` | Source files reference governing ADRs |

---

## Acceptance Criteria

- [x] All 8 scripts implemented
- [x] Scripts added to package.json
- [x] `validate:all` includes new scripts
- [x] Scripts work and produce useful output
- [x] `pnpm validate:all` passes (or violations documented)

---

## Notes

Port from itinerary-planner:
- `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-*.ts`

May need adaptation for choragen's simpler structure.

---

## Completion Notes

**Completed**: 2025-12-06

All 8 validation scripts implemented and registered in package.json:

| Script | Status | Notes |
|--------|--------|-------|
| `validate-complete-traceability` | ✅ Working | Checks Request → Design → ADR → Source chain |
| `validate-test-coverage` | ✅ Working | Checks design doc ↔ test bidirectional links |
| `validate-design-doc-content` | ✅ Working | Validates required sections in design docs |
| `validate-contract-coverage` | ✅ Working | Checks DesignContract usage (N/A for CLI-only) |
| `validate-adr-staleness` | ✅ Working | Flags stale ADRs in doing/ (14-day threshold) |
| `validate-request-staleness` | ✅ Working | Flags stale requests (14/7-day thresholds) |
| `validate-request-completion` | ✅ Working | Validates completion notes on done/ requests |
| `validate-source-adr-references` | ✅ Working | Validates source files reference ADRs |

**Validation Results**:
- `pnpm build` passes
- `pnpm validate:all` runs all scripts
- Some existing violations detected (expected for new validation):
  - 3 commits missing CR/FR references (historical)
  - 9 requests missing design doc links
  - 1 completed request with unchecked acceptance criteria
  - 1 test file with broken design doc link
