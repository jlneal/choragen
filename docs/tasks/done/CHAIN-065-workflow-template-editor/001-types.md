# Task: Extend WorkflowTemplate types with roleId, version, hooks

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 001-types  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Extend the existing `WorkflowTemplate` and `WorkflowTemplateStage` types in `@choragen/core` to support:
- Role assignment per stage (`roleId`)
- Template versioning (`version`, `displayName`, `description`, `builtin`, `createdAt`, `updatedAt`)
- Stage transition hooks (`onEnter`/`onExit` actions)

This is Phase 1 of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/core/src/workflow/types.ts — Add TransitionAction, StageTransitionHooks types`
- `packages/core/src/workflow/templates.ts — Extend WorkflowTemplate and WorkflowTemplateStage interfaces`
- `packages/core/src/workflow/__tests__/templates.test.ts — Add tests for new type fields`

---

## Acceptance Criteria

- [ ] WorkflowTemplate has: displayName?, description?, builtin, version, createdAt, updatedAt
- [ ] WorkflowTemplateStage has: roleId?, hooks?
- [ ] StageTransitionHooks type with onEnter? and onExit? arrays
- [ ] TransitionAction type with type: "command" | "task_transition" | "file_move" | "custom"
- [ ] Built-in templates updated with builtin: true, version: 1
- [ ] YAML parser updated to handle new fields
- [ ] Existing tests pass, new tests cover new fields
- [ ] pnpm build and pnpm test pass

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
