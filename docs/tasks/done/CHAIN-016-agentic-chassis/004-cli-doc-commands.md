# Task: Add CLI Document Creation Commands

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 004-cli-doc-commands  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add CLI commands for creating CRs, FRs, ADRs, and design documents. These are currently manual operations.

---

## Expected Files

Update:
- `packages/cli/src/cli.ts`

Create:
- `packages/cli/src/commands/docs.ts` (or similar)

---

## Commands to Add

### Change Request
```bash
choragen cr:new <slug> [title]
# Creates: docs/requests/change-requests/todo/CR-YYYYMMDD-NNN-<slug>.md
# Uses template: templates/change-request.md

choragen cr:close <id>
# Moves CR to done/, adds completion date
```

### Fix Request
```bash
choragen fr:new <slug> [title]
# Creates: docs/requests/fix-requests/todo/FR-YYYYMMDD-NNN-<slug>.md
# Uses template: templates/fix-request.md
```

### ADR
```bash
choragen adr:new <slug> [title]
# Creates: docs/adr/todo/ADR-NNN-<slug>.md
# Uses template: templates/adr.md
# Auto-increments ADR number

choragen adr:archive <file>
# Moves ADR to archive/YYYY-MM/
```

### Design Documents
```bash
choragen design:new persona <slug> [title]
choragen design:new scenario <slug> [title]
choragen design:new use-case <slug> [title]
choragen design:new feature <slug> [title]
choragen design:new enhancement <slug> [title]
# Creates in: docs/design/core/<type>/<slug>.md
# Uses appropriate template
```

---

## Implementation Notes

1. **ID Generation**:
   - CR/FR: `CR-YYYYMMDD-NNN` where NNN is sequential for that day
   - ADR: `ADR-NNN` where NNN is sequential overall

2. **Template Processing**:
   - Read template from `templates/`
   - Replace placeholders: `{{ID}}`, `{{TITLE}}`, `{{DATE}}`, `{{SLUG}}`

3. **Output**:
   - Print created file path
   - Print next steps (e.g., "Edit the file to add details")

---

## Acceptance Criteria

- [ ] `choragen cr:new` creates CR from template
- [ ] `choragen fr:new` creates FR from template
- [ ] `choragen adr:new` creates ADR with auto-incremented number
- [ ] `choragen design:new <type>` creates design docs
- [ ] IDs are generated correctly
- [ ] Templates are used
- [ ] Help text is clear

---

## Verification

```bash
choragen cr:new test-feature "Test Feature"
# Should create docs/requests/change-requests/todo/CR-20251206-008-test-feature.md

choragen adr:new test-decision "Test Decision"
# Should create docs/adr/todo/ADR-004-test-decision.md

# Clean up test files after verification
```
