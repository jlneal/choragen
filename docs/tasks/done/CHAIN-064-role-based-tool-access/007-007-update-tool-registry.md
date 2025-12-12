# Task: Update ToolRegistry to resolve via RoleManager

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 007-007-update-tool-registry  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Add methods to `ToolRegistry` that resolve tools based on dynamic role IDs using `RoleManager`, while keeping backward compatibility with the existing `AgentRole` methods.

---

## Expected Files

- `packages/cli/src/runtime/tools/registry.ts - Add new methods`
- `packages/cli/src/__tests__/tool-registry.test.ts - Add tests for new methods`

---

## Acceptance Criteria

- [ ] New method: getToolsForRoleId(roleId: string, roleManager: RoleManager): Promise<ToolDefinition[]>
- [ ] - Looks up role by ID from RoleManager
- [ ] - Returns tools whose names are in the role's toolIds
- [ ] - Returns empty array if role not found
- [ ] New method: getProviderToolsForRoleId(roleId: string, roleManager: RoleManager): Promise<Tool[]>
- [ ] - Same as above but returns provider format
- [ ] Existing methods unchanged (backward compatible)
- [ ] Unit tests for new methods
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/cli test passes
- [ ] pnpm lint passes

---

## Constraints

- Do NOT remove existing getToolsForRole(role: AgentRole) methods yet
- New methods are async (RoleManager is async)
- Import RoleManager from @choragen/core

---

## Notes

The new methods take `RoleManager` as a parameter rather than storing it, to avoid coupling the registry to a specific project root.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
