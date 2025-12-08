# Task: Tool Executors

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 003-tool-executors  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the execution logic for each tool defined in the registry.

---

## Context

Task 002 defined tool schemas. This task implements the actual execution:
- Parse tool call parameters
- Execute the action (read chain status, transition task, etc.)
- Return structured results

Tools call into `@choragen/core` for actual task/chain operations.

---

## Expected Files

Modify:
- `packages/cli/src/runtime/tools/definitions/chain-status.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/task-status.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/task-list.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/task-start.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/task-complete.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/task-approve.ts` — Add executor
- `packages/cli/src/runtime/tools/definitions/spawn-impl-session.ts` — Add executor (stub)

Create:
- `packages/cli/src/runtime/tools/executor.ts` — Tool execution dispatcher

---

## Acceptance Criteria

- [ ] Each tool definition includes an `execute(params, context)` function
- [ ] `chain:status` reads chain from `docs/tasks/` and returns status
- [ ] `task:status` reads task file and returns details
- [ ] `task:list` lists tasks in a chain directory
- [ ] `task:start` transitions task to in-progress (calls core)
- [ ] `task:complete` transitions task to in-review (calls core)
- [ ] `task:approve` transitions task to done (calls core)
- [ ] `spawn_impl_session` returns stub result (actual nesting is Phase 2)
- [ ] `ToolExecutor` class dispatches tool calls to correct executor
- [ ] Executors return structured JSON results
- [ ] Error handling returns clear error messages
- [ ] Unit tests for each executor
- [ ] TypeScript compiles without errors

---

## Constraints

- `spawn_impl_session` should return a stub message like "Nested sessions not yet implemented (Phase 2)"
- Use `@choragen/core` for task transitions where possible
- Do NOT implement file read/write

---

## Notes

**Executor Pattern**:
```typescript
export interface ToolExecutor {
  execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ExecutionContext {
  role: AgentRole;
  chainId?: string;
  taskId?: string;
  workspaceRoot: string;
}
```

**Example chain:status executor**:
```typescript
async execute(params: { chainId: string }, context: ExecutionContext): Promise<ToolResult> {
  const chainDir = path.join(context.workspaceRoot, 'docs/tasks');
  // Find chain across todo/in-progress/done directories
  // Parse task files, count by status
  // Return summary
}
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
