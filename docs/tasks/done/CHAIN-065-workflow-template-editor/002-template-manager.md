# Task: Implement TemplateManager with CRUD and versioning

**Chain**: CHAIN-065-workflow-template-editor  
**Task**: 002-template-manager  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement a `TemplateManager` class in `@choragen/core` that provides CRUD operations for workflow templates with version history support. The manager should:
- List all templates (built-in + custom)
- Get, create, update, delete custom templates
- Duplicate templates
- Store version history in `.choragen/workflow-template-versions/`
- Support restoring previous versions

This is Phase 1 (continued) of CR-20251211-002 (Workflow Template Editor).

---

## Expected Files

- `packages/core/src/workflow/template-manager.ts — New TemplateManager class`
- `packages/core/src/workflow/index.ts — Export TemplateManager`
- `packages/core/src/workflow/__tests__/template-manager.test.ts — Unit tests`

---

## Acceptance Criteria

- [ ] TemplateManager.list() returns all templates (built-in + custom)
- [ ] TemplateManager.get(name) returns a template by name
- [ ] TemplateManager.create(template) creates a new custom template (version 1)
- [ ] TemplateManager.update(name, changes, meta) updates template and increments version
- [ ] TemplateManager.delete(name) deletes custom templates (not built-in)
- [ ] TemplateManager.duplicate(sourceName, newName) copies a template
- [ ] TemplateManager.listVersions(name) returns version history
- [ ] TemplateManager.getVersion(name, version) returns a specific version snapshot
- [ ] TemplateManager.restoreVersion(name, version, changedBy) restores a previous version
- [ ] Version history stored in .choragen/workflow-template-versions/{name}/v{N}.yaml
- [ ] Built-in templates cannot be deleted (throw error)
- [ ] pnpm build and pnpm --filter @choragen/core test pass

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
