# Task: Add validate-contract-coverage script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 004-contract-coverage  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks DesignContract usage in API routes/handlers.

---

## Expected Files

Create:
- `scripts/validate-contract-coverage.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script finds API routes/handlers
- [ ] Script checks for DesignContract usage
- [ ] Reports routes missing contracts
- [ ] Script added to package.json

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-contract-coverage.ts`

For choragen, this applies to CLI commands and any future API endpoints. May be minimal initially.

**Verification**:
```bash
node scripts/validate-contract-coverage.mjs
```
