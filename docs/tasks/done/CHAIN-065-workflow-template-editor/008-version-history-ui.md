# Task: Build version history page /workflows/[name]/versions

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 008-version-history-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Build the version history page at `/workflows/[name]/versions` that displays a table of template versions with metadata (version #, changed by, description, date). Users can view read-only snapshots of previous versions and restore them as new versions.

This is the final task of Phase 2 for CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/web/src/app/workflows/[name]/versions/page.tsx — Version history list page`
- `packages/web/src/app/workflows/[name]/versions/[version]/page.tsx — Read-only version snapshot view`
- `packages/web/src/components/workflows/version-table.tsx — Version history table component`

---

## Acceptance Criteria

- [ ] Page at /workflows/[name]/versions loads versions via workflowTemplates.listVersions
- [ ] Table displays: Version #, Changed By, Change Description, Date
- [ ] Clicking a version row navigates to /workflows/[name]/versions/[version]
- [ ] Version detail page loads snapshot via workflowTemplates.getVersion
- [ ] Version detail shows read-only template form (stages, metadata)
- [ ] "Restore" button calls workflowTemplates.restoreVersion with confirmation
- [ ] After restore, redirects to template editor with new version
- [ ] Link back to template editor from version history
- [ ] Uses shadcn/ui components (Table, Button, Badge, Card)
- [ ] pnpm build passes

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
