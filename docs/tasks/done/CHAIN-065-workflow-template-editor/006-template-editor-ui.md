# Task: Build template editor page /workflows/[name]

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 006-template-editor-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Build the template editor page at `/workflows/[name]` for viewing and editing workflow templates. The page displays template metadata (name, displayName, description, version) and a list of stages. Built-in templates are read-only; custom templates can be edited and saved.

This is Phase 2 (continued) of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/web/src/app/workflows/[name]/page.tsx — Template editor page`
- `packages/web/src/app/workflows/new/page.tsx — Create new template page`
- `packages/web/src/components/workflows/template-form.tsx — Reusable template form component`

---

## Acceptance Criteria

- [ ] Page at /workflows/[name] loads template via workflowTemplates.get
- [ ] Header shows: Name (read-only for built-in), Display name, Description, Version badge
- [ ] Stages section displays vertical list of stage cards
- [ ] Each stage card shows: name, type, roleId, gate type, gate config
- [ ] Built-in templates show read-only view with "Duplicate" CTA
- [ ] Custom templates show Save/Cancel/Delete buttons
- [ ] Save calls workflowTemplates.update with changedBy/changeDescription
- [ ] Delete calls workflowTemplates.delete with confirmation
- [ ] /workflows/new page creates new template via workflowTemplates.create
- [ ] Form validation for required fields (name, at least one stage)
- [ ] Uses shadcn/ui components (Card, Input, Textarea, Select, Button, Badge)
- [ ] pnpm build passes
- [ ] Note: Stage editing (add/remove/reorder/edit) is deferred to task 007-stage-editor.

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
