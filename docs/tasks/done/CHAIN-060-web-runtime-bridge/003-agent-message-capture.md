# Task: Capture messages from agent sessions and store in workflow

**Chain**: CHAIN-060-web-runtime-bridge  
**Task**: 003-agent-message-capture  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

When an agent session runs within a workflow, its messages (responses, tool calls, etc.) should be automatically captured and stored in the workflow's message history. This enables the chat UI to display agent activity in real-time.



---

## Expected Files

- `packages/core/src/workflow/manager.ts` — Add method to capture agent output
- `packages/core/src/workflow/types.ts` — Extend message metadata for agent output
- `packages/web/src/server/routers/workflow.ts` — (if needed) Endpoint for agent to push messages
- Tests for message capture flow


---

## Acceptance Criteria

- [x] Agent session output can be captured as workflow messages
- [x] Messages include role (`control` or `impl`) based on agent type
- [x] Tool calls are stored in message metadata (WorkflowMessageMetadata)
- [x] Messages are persisted to workflow JSON
- [x] Real-time subscription receives agent messages
- [x] Tests verify capture and storage (manager.test.ts)
- [x] `pnpm --filter @choragen/core test` passes
- [x] `pnpm --filter @choragen/web typecheck` passes


---

## Notes

### Integration Point

The agent runtime (from `choragen agent:start` or future web-based execution) needs to call `WorkflowManager.addMessage()` as it produces output. This task focuses on:

1. Ensuring the message format supports agent output (tool calls, streaming chunks)
2. Providing a clear API for the runtime to push messages
3. Testing that messages flow through to the subscription

### Message Metadata

Agent messages should include metadata like:
```typescript
{
  role: "impl" | "control",
  content: "Agent response text",
  stageIndex: 2,
  metadata: {
    toolCalls?: Array<{ name: string; args: unknown; result?: unknown }>,
    streaming?: boolean,
    sessionId?: string
  }
}
```

### Reference

- `WorkflowManager.addMessage()` in `packages/core/src/workflow/manager.ts`
- Message types in `packages/core/src/workflow/types.ts`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
