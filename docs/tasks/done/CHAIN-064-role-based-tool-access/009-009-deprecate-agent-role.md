# Task: Remove allowedRoles from ToolDefinition, deprecate AgentRole

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 009-009-deprecate-agent-role  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Remove the `allowedRoles` field from `ToolDefinition` and deprecate the `AgentRole` type, completing the migration to dynamic roles.

---

## Expected Files

- `packages/cli/src/runtime/tools/types.ts - Remove allowedRoles, add deprecation comment to AgentRole`
- `packages/cli/src/runtime/tools/definitions/*.ts - Remove allowedRoles from all 11 tools`
- `packages/cli/src/runtime/tools/registry.ts - Remove old getToolsForRole(AgentRole) methods`
- `packages/cli/src/runtime/governance-gate.ts - Remove old validate(toolCall, AgentRole) methods`
- `packages/cli/src/__tests__/*.ts - Update all tests`

---

## Acceptance Criteria

- [ ] ToolDefinition no longer has allowedRoles field
- [ ] AgentRole type marked as @deprecated with comment pointing to dynamic roles
- [ ] All 11 tool definitions updated (remove allowedRoles)
- [ ] Old methods removed from ToolRegistry:
- [ ] - getToolsForRole(role: AgentRole)
- [ ] - getProviderToolsForRole(role: AgentRole)
- [ ] - getToolsForStage(role: AgentRole, ...)
- [ ] - canRoleUseTool(role: AgentRole, ...)
- [ ] Old methods removed from GovernanceGate:
- [ ] - validate(toolCall, role: AgentRole)
- [ ] - validateAsync(toolCall, role: AgentRole, ...)
- [ ] All tests updated to use new *WithRoleId methods
- [ ] pnpm build passes
- [ ] pnpm test passes (all packages)
- [ ] pnpm lint passes

---

## Constraints

- This is a breaking change - ensure all callers are updated
- Keep AgentRole type for now (deprecated) to ease migration
- Update test mocks to not include allowedRoles

---

## Notes

This task has the largest blast radius. Take care to update all references.

Search for `allowedRoles` and `AgentRole` across the codebase to find all usages.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
