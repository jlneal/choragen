# Task: Build template list page /workflows

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 005-template-list-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Build the template list page at `/workflows` that displays all workflow templates (built-in + custom) with filtering, search, and actions for viewing, editing, duplicating, and deleting templates.

This is Phase 2 (continued) of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/web/src/app/workflows/page.tsx — Template list page`
- `packages/web/src/app/workflows/layout.tsx — Layout wrapper (optional)`
- `packages/web/src/components/workflows/template-card.tsx — Template card component`
- `packages/web/src/components/workflows/template-list.tsx — Template list/grid component`

---

## Acceptance Criteria

- [ ] Page at /workflows renders list of templates from workflowTemplates.list
- [ ] Each template shows: Name, Description, Stage count, Version, Last updated
- [ ] Built-in templates have a badge indicator
- [ ] Actions per template: View, Edit (disabled for built-in), Duplicate, Delete (disabled for built-in)
- [ ] "Create Template" button links to /workflows/new
- [ ] Filter tabs: All, Built-in, Custom
- [ ] Search input filters by name/description
- [ ] Delete action shows confirmation dialog and calls workflowTemplates.delete
- [ ] Duplicate action prompts for new name and calls workflowTemplates.duplicate
- [ ] Uses shadcn/ui components (Card, Badge, Button, Input, Tabs)
- [ ] pnpm build passes

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
