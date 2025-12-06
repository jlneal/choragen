# Task: Add design doc references to ADRs in done/

**Chain**: CHAIN-001-complete-bootstrap  
**Task**: 003-fix-adr-links  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Update ADRs in `docs/adr/done/` to include `**Linked Design Docs**` field
pointing to the relevant design documents.

---

## Expected Files

- `docs/adr/done/ADR-001-task-file-format.md → link to task-chain-management.md`
- `docs/adr/done/ADR-002-governance-schema.md → link to governance-enforcement.md`
- `docs/adr/done/ADR-003-file-locking.md → link to file-locking.md`

---

## Acceptance Criteria

- [ ] All ADRs in done/ have **Linked Design Docs** field
- [ ] Links point to actual design doc files
- [ ] pnpm validate:adr-traceability shows no warnings for ADR links

---

## Notes

Add to the header section of each ADR:
```markdown
**Linked Design Docs**: docs/design/core/features/xxx.md
```
