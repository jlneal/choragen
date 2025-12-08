# Task: Prompt Loader

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 005-prompt-loader  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create the prompt loader that builds role-specific system prompts with dynamic context.

---

## Context

Each agent session needs a system prompt that includes:
1. Role-specific instructions (from `docs/agents/*.md`)
2. Current project state (active chains, assigned task)
3. Available tools summary
4. Session metadata

The prompt loader assembles these pieces into a complete system prompt.

---

## Expected Files

Create:
- `packages/cli/src/runtime/prompt-loader.ts` — Prompt assembly

---

## Acceptance Criteria

- [ ] `PromptLoader` class with `load(role, context)` method
- [ ] Reads base prompt from `docs/agents/control-agent.md` or `docs/agents/impl-agent.md`
- [ ] Injects current chain/task context if provided
- [ ] Includes list of available tools for the role
- [ ] Includes session metadata (session ID, start time)
- [ ] Returns complete system prompt string
- [ ] Handles missing agent docs gracefully (fallback prompt)
- [ ] Unit tests for prompt assembly
- [ ] TypeScript compiles without errors

---

## Constraints

- Keep prompts concise — don't bloat with unnecessary context
- Do NOT include full file contents in prompts
- Use existing `docs/agents/*.md` files as base prompts

---

## Notes

**Interface**:
```typescript
interface PromptLoader {
  load(role: AgentRole, context: SessionContext): Promise<string>;
}

interface SessionContext {
  sessionId: string;
  chainId?: string;
  taskId?: string;
  workspaceRoot: string;
  availableTools: string[];
}
```

**Prompt Structure**:
```
[Base role instructions from docs/agents/{role}-agent.md]

---

## Current Session

- **Session ID**: session-20251208-123456
- **Role**: control
- **Chain**: CHAIN-037-agent-runtime-core (if assigned)
- **Task**: 001-provider-abstraction (if assigned)

## Available Tools

- chain:status — View chain status
- task:list — List tasks in chain
- task:start — Start a task
- task:approve — Approve completed task
- spawn_impl_session — Spawn nested impl agent

---

You are operating within the Choragen agent runtime. All tool calls will be validated against governance rules before execution.
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
