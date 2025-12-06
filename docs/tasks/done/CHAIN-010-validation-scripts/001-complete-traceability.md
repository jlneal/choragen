# Task: Add validate-complete-traceability script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 001-complete-traceability  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks the full Request → Design → ADR → Code traceability chain.

---

## Expected Files

Create:
- `scripts/validate-complete-traceability.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script validates Request → Design Doc links
- [ ] Script validates Design Doc → ADR links
- [ ] Script validates ADR → Source file links
- [ ] Clear error messages for broken chains
- [ ] Script added to package.json
- [ ] `validate:all` updated
- [ ] `pnpm validate:complete-traceability` works

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-complete-traceability.ts`

Adapt for choragen's simpler structure. May need to check:
- CRs/FRs reference design docs
- Design docs reference ADRs
- ADRs reference source files

**Verification**:
```bash
node scripts/validate-complete-traceability.mjs
```
