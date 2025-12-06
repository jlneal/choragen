# Task: Add task:delegate to MCP server

**Chain**: CHAIN-005-agent-runner  
**Task**: 006-mcp-integration  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add the `task:delegate` MCP tool that control agents use to spawn impl agents. This connects the MCP server to the agent-runner package.

---

## Expected Files

Modify:
- `mcp-server/src/tools/index.ts` - Add task:delegate tool
- `mcp-server/package.json` - Add @choragen/agent-runner dependency

Create:
- `mcp-server/src/tools/task-delegate.ts` - Tool implementation

---

## Acceptance Criteria

- [ ] `task:delegate` tool implemented
- [ ] Takes chainId, taskId, provider, model as parameters
- [ ] Reads API key from environment (ANTHROPIC_API_KEY or OPENAI_API_KEY)
- [ ] Spawns agent runner and returns result
- [ ] Returns success, filesChanged, and summary
- [ ] `pnpm build` passes

---

## Notes

**task-delegate.ts**:
```typescript
// ADR: ADR-004-agent-runner

import { runAgent } from "@choragen/agent-runner";
import { buildImplAgentPrompt } from "@choragen/agent-runner/prompts";
import path from "path";

export const taskDelegateTool = {
  name: "task:delegate",
  description: "Delegate a task to an implementation agent",
  inputSchema: {
    type: "object",
    properties: {
      chainId: { type: "string", description: "Chain ID (e.g., CHAIN-005-agent-runner)" },
      taskId: { type: "string", description: "Task ID (e.g., 001-package-scaffold)" },
      provider: { type: "string", enum: ["anthropic", "openai"], description: "LLM provider" },
      model: { type: "string", description: "Model name (e.g., claude-sonnet-4-20250514)" },
    },
    required: ["chainId", "taskId", "provider", "model"],
  },
  
  async execute({ chainId, taskId, provider, model }) {
    const workingDir = process.cwd();
    const taskFile = path.join(workingDir, "docs/tasks/todo", chainId, `${taskId}.md`);
    
    const apiKey = provider === "anthropic" 
      ? process.env.ANTHROPIC_API_KEY 
      : process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`Missing ${provider.toUpperCase()}_API_KEY environment variable`);
    }
    
    const result = await runAgent({
      provider,
      model,
      apiKey,
      systemPrompt: buildImplAgentPrompt(taskFile, workingDir),
      initialMessage: `Start task ${taskFile}`,
      workingDir,
    });
    
    return {
      success: result.success,
      filesChanged: result.filesChanged,
      error: result.error,
      // Last assistant message is the summary
      summary: result.messages
        .filter(m => m.role === "assistant")
        .pop()?.content ?? "",
    };
  },
};
```

**Verification**:
```bash
pnpm build
```
