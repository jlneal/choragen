# Fix Request: Add Missing Validation Scripts

**ID**: FR-20251206-006  
**Domain**: core  
**Status**: todo  
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

- [ ] All 8 scripts implemented
- [ ] Scripts added to package.json
- [ ] `validate:all` includes new scripts
- [ ] Scripts work and produce useful output
- [ ] `pnpm validate:all` passes (or violations documented)

---

## Notes

Port from itinerary-planner:
- `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-*.ts`

May need adaptation for choragen's simpler structure.

---

## Completion Notes

[To be added when moved to done/]
