# Task: Create tRPC routers for roles and tools

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 010-010-trpc-routers  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create tRPC routers that expose `RoleManager` and `ToolMetadataExtractor` functionality to the web UI, enabling CRUD operations on roles and read-only access to tool metadata.

---

## Expected Files

- `packages/web/src/server/routers/role.ts - Role CRUD router`
- `packages/web/src/server/routers/tool.ts - Tool metadata router`
- `packages/web/src/server/routers/index.ts - Export new routers`
- `Update packages/web/src/server/root.ts to include new routers`

---

## Acceptance Criteria

- [ ] roleRouter with procedures:
- [ ] - list - Returns all roles
- [ ] - get - Returns single role by ID
- [ ] - create - Creates new role (input: name, toolIds)
- [ ] - update - Updates role (input: id, name?, toolIds?)
- [ ] - delete - Deletes role by ID
- [ ] toolRouter with procedures:
- [ ] - list - Returns all tool metadata
- [ ] - getCategories - Returns category list
- [ ] - sync - Triggers tool sync (calls ToolMetadataExtractor)
- [ ] Routers use project context from tRPC context
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/web test passes (if tests exist)
- [ ] pnpm lint passes

---

## Constraints

- Use existing tRPC patterns from other routers in the web package
- RoleManager and ToolMetadataExtractor need project root - get from context
- All mutations should invalidate relevant queries

---

## Notes

Check existing routers like `workflow.ts` for patterns on how to structure procedures and handle context.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
