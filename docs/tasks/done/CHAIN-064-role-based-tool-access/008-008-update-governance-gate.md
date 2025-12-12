# Task: Update GovernanceGate to use dynamic roles

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 008-008-update-governance-gate  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Add methods to `GovernanceGate` that validate tool calls using dynamic role IDs via `RoleManager`, while keeping backward compatibility with existing `AgentRole` methods.

---

## Expected Files

- `packages/cli/src/runtime/governance-gate.ts - Add new methods`
- `packages/cli/src/__tests__/governance-gate.test.ts - Add tests for new methods`

---

## Acceptance Criteria

- [ ] New method: validateWithRoleId(toolCall: ToolCall, roleId: string, roleManager: RoleManager): Promise<ValidationResult>
- [ ] - Looks up role by ID from RoleManager
- [ ] - Checks if tool name is in role's toolIds
- [ ] - Returns { allowed: false, reason: "Role not found" } if role doesn't exist
- [ ] - Returns { allowed: false, reason: "Tool not allowed for role" } if tool not in toolIds
- [ ] New method: validateAsyncWithRoleId(...) - includes lock checking
- [ ] Existing methods unchanged (backward compatible)
- [ ] Unit tests for new methods
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/cli test passes
- [ ] pnpm lint passes

---

## Constraints

- Do NOT remove existing validate(toolCall, role: AgentRole) methods yet
- New methods are async
- File path validation still uses existing governance rules

---

## Notes

The dynamic role validation bypasses the `allowedRoles` array on `ToolDefinition` and instead uses the role's `toolIds` from `RoleManager`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
