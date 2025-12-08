# Task: Agentic Loop

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 006-agentic-loop  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the core agentic loop that orchestrates LLM calls, tool execution, and governance validation.

---

## Context

This is the heart of the agent runtime. The loop:
1. Sends messages to the LLM with available tools
2. Receives response with potential tool calls
3. Validates each tool call against governance
4. Executes allowed tools, rejects violations
5. Adds results to conversation history
6. Repeats until the agent signals completion

**Reference**: ADR-010 Section 1 (CLI as Runtime), design doc agentic loop pseudocode

---

## Expected Files

Create:
- `packages/cli/src/runtime/loop.ts` — Agentic loop implementation
- `packages/cli/src/runtime/index.ts` — Public exports

---

## Acceptance Criteria

- [ ] `runAgentSession(config)` function that runs the loop
- [ ] Loads system prompt via PromptLoader
- [ ] Gets tools for role via ToolRegistry
- [ ] Calls LLM via provider abstraction
- [ ] Validates tool calls via GovernanceGate
- [ ] Executes allowed tools via ToolExecutor
- [ ] Adds tool results to conversation history
- [ ] Handles governance violations (adds error message, continues)
- [ ] Terminates on `end_turn` stop reason
- [ ] Terminates on max iterations (safety limit, default 50)
- [ ] Returns session summary (tokens used, tools called, outcome)
- [ ] Unit tests with mocked LLM provider
- [ ] TypeScript compiles without errors

---

## Constraints

- Do NOT implement streaming output yet (just log to console)
- Do NOT implement session persistence yet (Task 007)
- Do NOT implement nested sessions yet (Phase 2)
- Keep the loop simple and testable

---

## Notes

**Interface**:
```typescript
interface AgentSessionConfig {
  role: AgentRole;
  provider: LLMProvider;
  chainId?: string;
  taskId?: string;
  workspaceRoot: string;
  maxIterations?: number;
  dryRun?: boolean;
}

interface SessionResult {
  success: boolean;
  iterations: number;
  toolCalls: ToolCallRecord[];
  tokensUsed: { input: number; output: number };
  error?: string;
}

async function runAgentSession(config: AgentSessionConfig): Promise<SessionResult>;
```

**Loop Pseudocode** (from design doc):
```typescript
while (true) {
  const response = await llmClient.chat({ messages, tools });
  
  for (const toolCall of response.toolCalls) {
    const validation = governanceGate.validate(toolCall, role);
    if (!validation.allowed) {
      messages.push({ role: 'tool', content: `DENIED: ${validation.reason}` });
      continue;
    }
    
    const result = await toolExecutor.execute(toolCall);
    messages.push({ role: 'tool', content: JSON.stringify(result) });
  }
  
  if (response.stopReason === 'end_turn') break;
  if (iterations++ >= maxIterations) break;
}
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
