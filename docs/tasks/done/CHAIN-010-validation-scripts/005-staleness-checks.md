# Task: Add staleness validation scripts

**Chain**: CHAIN-010-validation-scripts  
**Task**: 005-staleness-checks  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation scripts that flag stale ADRs and requests.

---

## Expected Files

Create:
- `scripts/validate-adr-staleness.mjs`
- `scripts/validate-request-staleness.mjs`

Update:
- `package.json` - Add script entries
- Update `validate:all` to include new scripts

---

## Acceptance Criteria

- [ ] ADR staleness script flags ADRs in doing/ > N days
- [ ] Request staleness script flags requests in doing/ > N days
- [ ] Configurable threshold (default: 14 days)
- [ ] Scripts added to package.json
- [ ] `validate:all` updated

---

## Notes

**Port from**: 
- `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-adr-staleness.ts`
- `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-request-staleness.ts`

Use git history or file mtime to determine age.

**Verification**:
```bash
node scripts/validate-adr-staleness.mjs
node scripts/validate-request-staleness.mjs
```
