# Task: Create tRPC router for workflow templates API

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 004-trpc-router  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create a tRPC router for workflow template management that exposes `TemplateManager` from `@choragen/core` to the web dashboard. The router should provide CRUD operations, duplication, and version history/restore functionality.

This is Phase 2 of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/web/src/server/routers/workflow-template.ts — New tRPC router for templates`
- `packages/web/src/server/routers/index.ts — Mount as workflowTemplates`

---

## Acceptance Criteria

- [ ] workflowTemplates.list — Returns all templates (built-in + custom)
- [ ] workflowTemplates.get — Returns single template by name
- [ ] workflowTemplates.create — Creates new custom template (version 1)
- [ ] workflowTemplates.update — Updates template, increments version
- [ ] workflowTemplates.delete — Deletes custom template (errors on built-in)
- [ ] workflowTemplates.duplicate — Copies template to new name
- [ ] workflowTemplates.listVersions — Returns version history for a template
- [ ] workflowTemplates.getVersion — Returns specific version snapshot
- [ ] workflowTemplates.restoreVersion — Restores previous version as new version
- [ ] Proper Zod input validation schemas
- [ ] Serialization handles Date fields (ISO strings)
- [ ] pnpm build and pnpm --filter @choragen/web typecheck pass

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
