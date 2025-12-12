# Task: Build role editor page (/roles/[id])

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 012-012-role-editor-page  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create a web page for editing individual roles, allowing users to modify the role name and select which tools are assigned to the role.

---

## Expected Files

- `packages/web/src/app/roles/[id]/page.tsx - Role editor page`
- `packages/web/src/app/roles/new/page.tsx - New role page (may redirect to [id] with "new")`
- `packages/web/src/components/roles/tool-selector.tsx - Tool multi-select component`

---

## Acceptance Criteria

- [ ] Edit existing role:
- [ ] - Loads role data from roleRouter.get
- [ ] - Displays editable name field
- [ ] - Shows tool selector with current tools checked
- [ ] Create new role:
- [ ] - Empty form with name field
- [ ] - Tool selector with no tools checked
- [ ] Tool selector:
- [ ] - Lists all tools from toolRouter.list
- [ ] - Grouped by category
- [ ] - Checkbox for each tool
- [ ] - Shows tool description on hover/expand
- [ ] Save button calls roleRouter.update or roleRouter.create
- [ ] Delete button (edit mode only) calls roleRouter.delete with confirmation
- [ ] Success redirects to /roles
- [ ] Form validation (name required, at least one tool)
- [ ] pnpm build passes
- [ ] pnpm lint passes

---

## Constraints

- Use React Hook Form or similar for form state
- Use shadcn/ui components (Form, Input, Checkbox, Button, Dialog)
- Optimistic updates where appropriate

---

## Notes

The tool selector is the key component - consider making it reusable for future use in workflow template stages.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
