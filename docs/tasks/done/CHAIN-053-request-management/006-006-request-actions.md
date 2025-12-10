# Task: Create RequestActions dropdown component

**Chain**: CHAIN-053-request-management  
**Task**: 006-006-request-actions  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a `RequestActions` dropdown component that provides status transitions and management actions for a request.

The component should:
1. Show available actions based on current status
2. Handle state transitions (promote, demote, start, close)
3. Provide edit and delete options
4. Use confirmation dialogs for destructive actions

---

## Expected Files

- `packages/web/src/components/requests/request-actions.tsx` (create)
- `packages/web/src/components/requests/index.ts` (modify - add export)

---

## Acceptance Criteria

- [ ] Dropdown menu with MoreVertical icon trigger
- [ ] Status-aware actions:
  - backlog: "Promote to Todo"
  - todo: "Start Work" (→ doing), "Demote to Backlog"
  - doing: "Close Request" (opens dialog for completion notes)
  - done: "Reopen" (→ todo)
- [ ] Edit action opens edit form/dialog
- [ ] Delete action shows confirmation dialog
- [ ] All actions call appropriate tRPC mutations
- [ ] Shows loading state during mutations
- [ ] Uses shadcn/ui DropdownMenu component

---

## Notes

Reference `packages/web/src/components/groups/group-actions.tsx` for dropdown pattern. The "Close Request" action should open a dialog to enter completion notes.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
