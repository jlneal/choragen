# Task: Add validate-request-completion script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 006-request-completion  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks closed requests have completion notes.

---

## Expected Files

Create:
- `scripts/validate-request-completion.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script checks requests in done/ have completion notes
- [ ] Completion notes section is not empty/placeholder
- [ ] Reports incomplete closures
- [ ] Script added to package.json

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-request-completion.ts`

Check for `## Completion Notes` section with actual content (not just placeholder text).

**Verification**:
```bash
node scripts/validate-request-completion.mjs
```
