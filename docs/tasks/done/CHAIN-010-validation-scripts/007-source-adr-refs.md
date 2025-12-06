# Task: Add validate-source-adr-references script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 007-source-adr-refs  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks source files reference their governing ADRs.

---

## Expected Files

Create:
- `scripts/validate-source-adr-references.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script scans source files in packages/
- [ ] Checks for ADR reference comments (e.g., `// ADR: ADR-001-...`)
- [ ] Reports files missing ADR references
- [ ] Configurable file patterns to check
- [ ] Script added to package.json

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-source-adr-references.ts`

Not all files need ADR refs - focus on significant implementation files (not index.ts, types, etc.).

**Verification**:
```bash
node scripts/validate-source-adr-references.mjs
```
