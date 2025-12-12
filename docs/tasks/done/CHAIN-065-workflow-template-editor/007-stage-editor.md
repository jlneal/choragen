# Task: Build stage editor component with role/gate/hook config

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 007-stage-editor  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Build a stage editor component that enables full stage editing within the template editor. This includes adding/removing stages, reordering via drag-and-drop, and editing stage properties (name, type, roleId, gate type, gate config, hooks).

This is Phase 2 (continued) of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/web/src/components/workflows/stage-editor.tsx — Stage card editor component`
- `packages/web/src/components/workflows/stage-list.tsx — Sortable stage list with drag-and-drop`
- `Update packages/web/src/components/workflows/template-form.tsx — Integrate stage editor`

---

## Acceptance Criteria

- [ ] Stage card shows editable fields: name, type dropdown, roleId dropdown, gate type dropdown
- [ ] Gate-specific fields appear based on gate type (prompt for human_approval, commands for verification_pass)
- [ ] Role dropdown fetches roles via roles.list and shows tool count
- [ ] "Add Stage" button appends a new stage with defaults
- [ ] Delete stage button removes stage (with confirmation if >1 stage)
- [ ] Drag-and-drop reordering of stages (use @dnd-kit or similar)
- [ ] Hook configuration UI (onEnter/onExit actions) — basic list display, defer full editor if complex
- [ ] Tool preview collapsible section shows tools from assigned role
- [ ] Changes propagate to parent form state
- [ ] pnpm build passes

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
