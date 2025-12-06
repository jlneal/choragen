# Task: Implement agent loop with tool execution

**Chain**: CHAIN-005-agent-runner  
**Task**: 004-agent-loop  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Implement the core agent loop that sends messages to the LLM, executes tool calls, and continues until the agent signals completion.

---

## Expected Files

Create:
- `packages/agent-runner/src/runner/types.ts` - Runner types
- `packages/agent-runner/src/runner/agent-loop.ts` - Main loop
- `packages/agent-runner/src/runner/index.ts` - Exports

---

## Acceptance Criteria

- [ ] `runAgent(config)` function implemented
- [ ] Loop continues until agent stops using tools
- [ ] Tool results fed back to LLM
- [ ] Max turns limit (prevent infinite loops)
- [ ] Returns conversation history and result
- [ ] `pnpm build` passes

---

## Notes

**types.ts**:
```typescript
// ADR: ADR-004-agent-runner

import { Provider, Message } from "../providers/types.js";

export interface AgentConfig {
  provider: Provider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  initialMessage: string;
  workingDir: string;
  maxTurns?: number; // Default: 50
}

export interface AgentResult {
  success: boolean;
  messages: Message[];
  error?: string;
  filesChanged: string[];
}
```

**agent-loop.ts**:
```typescript
// ADR: ADR-004-agent-runner

import { getClient } from "../providers/index.js";
import { TOOLS, executeTool } from "../tools/index.js";
import { AgentConfig, AgentResult } from "./types.js";

const DEFAULT_MAX_TURNS = 50;

export async function runAgent(config: AgentConfig): Promise<AgentResult> {
  const client = getClient(config.provider, config.apiKey);
  const messages: Message[] = [
    { role: "user", content: config.initialMessage }
  ];
  const filesChanged: string[] = [];
  const maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;
  
  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await client.complete({
      model: config.model,
      system: config.systemPrompt,
      messages,
      tools: TOOLS.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    });
    
    messages.push({
      role: "assistant",
      content: response.content,
      toolCalls: response.toolCalls,
    });
    
    // No tool calls = agent is done
    if (!response.toolCalls?.length) {
      return { success: true, messages, filesChanged };
    }
    
    // Execute each tool call
    for (const toolCall of response.toolCalls) {
      try {
        const result = await executeTool(toolCall.name, toolCall.arguments);
        messages.push({
          role: "tool",
          content: result,
          toolCallId: toolCall.id,
        });
        
        // Track file changes
        if (["write_file", "edit_file"].includes(toolCall.name)) {
          const path = toolCall.arguments.path as string;
          if (!filesChanged.includes(path)) {
            filesChanged.push(path);
          }
        }
      } catch (error) {
        messages.push({
          role: "tool",
          content: `Error: ${error.message}`,
          toolCallId: toolCall.id,
        });
      }
    }
  }
  
  return {
    success: false,
    messages,
    filesChanged,
    error: `Max turns (${maxTurns}) exceeded`,
  };
}
```

**Verification**:
```bash
pnpm build
```
