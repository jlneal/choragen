# Task: Add validate-design-doc-content script

**Chain**: CHAIN-010-validation-scripts  
**Task**: 003-design-doc-content  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation script that checks design docs have required sections.

---

## Expected Files

Create:
- `scripts/validate-design-doc-content.mjs`

Update:
- `package.json` - Add script entry
- Update `validate:all` to include new script

---

## Acceptance Criteria

- [ ] Script checks personas have required sections
- [ ] Script checks scenarios have required sections
- [ ] Script checks use-cases have required sections
- [ ] Script checks features have required sections
- [ ] Script checks enhancements have required sections
- [ ] Reports missing/incomplete sections
- [ ] Script added to package.json

---

## Notes

**Port from**: `/Users/justin/Projects/itinerary-planner/scripts/tasks/planning/validate-design-doc-content.ts`

Required sections vary by doc type. Check templates for expected structure.

**Verification**:
```bash
node scripts/validate-design-doc-content.mjs
```
