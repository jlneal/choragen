# Task: Add validate-test-coverage script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 002-test-coverage  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks bidirectional links between design docs and tests.

---

## Expected Files

Create:
- `scripts/validate-test-coverage.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script checks design docs reference test files
- [ ] Script checks test files reference design docs (via comments)
- [ ] Reports missing coverage
- [ ] Script added to package.json
- [ ] `validate:all` updated

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-test-coverage.ts`

For choragen, tests should reference the feature/scenario they validate.

**Verification**:
```bash
node scripts/validate-test-coverage.mjs
```
