# Task: Tool Registry with Role Filtering

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 002-tool-registry  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create the tool registry that defines available tools and filters them by agent role.

---

## Context

Each agent role (control, impl) has access to different tools. The registry:
1. Defines all available tools with their schemas
2. Filters tools based on the current role
3. Provides tool schemas in the format LLM providers expect

For Phase 1, we only implement CLI-style tools (chain/task management), not file operations.

**Reference**: ADR-010 Section 2 (Role-Gated Tool Sets)

---

## Expected Files

Create:
- `packages/cli/src/runtime/tools/types.ts` — Tool type definitions
- `packages/cli/src/runtime/tools/registry.ts` — Registry with role filtering
- `packages/cli/src/runtime/tools/definitions/chain-status.ts`
- `packages/cli/src/runtime/tools/definitions/task-status.ts`
- `packages/cli/src/runtime/tools/definitions/task-list.ts`
- `packages/cli/src/runtime/tools/definitions/task-start.ts`
- `packages/cli/src/runtime/tools/definitions/task-complete.ts`
- `packages/cli/src/runtime/tools/definitions/task-approve.ts`
- `packages/cli/src/runtime/tools/definitions/spawn-impl-session.ts`
- `packages/cli/src/runtime/tools/index.ts` — Exports

---

## Acceptance Criteria

- [ ] `Tool` type includes name, description, parameters schema, allowed roles
- [ ] `ToolRegistry` class with `getToolsForRole(role)` method
- [ ] Control role tools: `chain:status`, `task:list`, `task:start`, `task:approve`, `spawn_impl_session`
- [ ] Impl role tools: `chain:status`, `task:status`, `task:complete`
- [ ] Each tool has proper JSON Schema for parameters
- [ ] `spawn_impl_session` is control-only
- [ ] Unit tests verify role filtering works correctly
- [ ] TypeScript compiles without errors

---

## Constraints

- Tools define schema only — execution is in a separate task
- Do NOT implement file read/write tools (Phase 3)
- Keep tool definitions minimal for Phase 1

---

## Notes

**Phase 1 Tool Matrix**:

| Tool | Control | Impl | Description |
|------|---------|------|-------------|
| `chain:status` | ✓ | ✓ | View chain status |
| `task:status` | ✗ | ✓ | View current task details |
| `task:list` | ✓ | ✗ | List tasks in chain |
| `task:start` | ✓ | ✗ | Start a task |
| `task:complete` | ✗ | ✓ | Mark task complete |
| `task:approve` | ✓ | ✗ | Approve completed task |
| `spawn_impl_session` | ✓ | ✗ | Spawn nested impl agent |

**Tool Definition Pattern**:
```typescript
export const chainStatusTool: ToolDefinition = {
  name: 'chain:status',
  description: 'Get the status of a task chain',
  parameters: {
    type: 'object',
    properties: {
      chainId: { type: 'string', description: 'Chain ID (e.g., CHAIN-037-agent-runtime-core)' }
    },
    required: ['chainId']
  },
  allowedRoles: ['control', 'impl']
};
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
