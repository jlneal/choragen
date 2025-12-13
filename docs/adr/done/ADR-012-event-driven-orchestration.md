# ADR-012: Event-Driven Orchestration

**Status**: done  
**Created**: 2025-12-12  
**Linked CR/FR**: CR-20251212-004, CR-20251212-007  
**Linked Design Docs**: 
- docs/design/core/features/standard-workflow.md
- docs/design/core/features/workflow-orchestration.md

---

## Context

The Standard Workflow requires the Orchestration agent to coordinate multiple parallel chains and respond to task/chain completion events. The current design doesn't specify how this coordination happens.

Key question: **How does the orchestrator know when a task or chain completes?**

Options considered:
1. **Polling** — Orchestrator periodically checks status
2. **Direct function calls** — Hooks call orchestrator functions directly
3. **Message posting** — Hooks post messages to orchestrator session
4. **Event system** — Hooks emit events, orchestrator subscribes

---

## Decision

**Use message posting to sessions as the primary coordination mechanism.**

Hooks and tools can post messages directly into any active session, just like humans and agents do. This treats the orchestrator as a participant in the conversation, not a separate system.

### Why Message Posting?

1. **Unified model** — Everything is a message (human, agent, system, hook)
2. **Audit trail** — All coordination is captured in conversation history
3. **Simple implementation** — Extends existing message infrastructure
4. **Deterministic** — Hooks post messages, not agents deciding to check
5. **Debuggable** — Can see exactly what notifications were sent

### Message Types

```typescript
interface WorkflowMessage {
  id: string;
  role: "human" | "control" | "impl" | "system" | "hook";  // Add "hook"
  content: string;
  stageIndex: number;
  timestamp: Date;
  metadata?: {
    eventType?: string;  // "task:completed", "chain:approved", etc.
    sourceId?: string;   // Task/chain/workflow ID that triggered this
    payload?: Record<string, unknown>;
  };
}
```

### Hook Action: `post_message`

```yaml
hooks:
  - trigger: task:approve
    actions:
      - type: post_message
        target: orchestrator  # or specific session ID
        content: "Task {{taskId}} approved"
        metadata:
          eventType: "task:approved"
          sourceId: "{{taskId}}"
```

### Orchestrator Behavior

The Orchestration agent receives messages like any other participant:

```
[Hook] Task TASK-001 approved
  metadata: { eventType: "task:approved", sourceId: "TASK-001" }

[Orchestrator] Checking chain status...
> tool: chain:status CHAIN-001
> result: 2/3 tasks complete

[Orchestrator] Spawning agent for next task...
> tool: spawn_agent --role=implementation --task=TASK-002
```

The orchestrator's system prompt instructs it to respond to hook messages appropriately.

---

## Alternatives Considered

### Polling

```typescript
while (chainNotComplete) {
  await sleep(1000);
  const status = await getChainStatus(chainId);
  // ...
}
```

**Rejected because:**
- Wastes tokens on repeated status checks
- Latency between completion and detection
- Not deterministic — depends on poll interval
- Clutters conversation with polling messages

### Direct Function Calls

```typescript
// In hook execution
await orchestrator.onTaskComplete(taskId);
```

**Rejected because:**
- Tight coupling between hooks and orchestrator
- Not captured in conversation history
- Different code path than normal agent interaction
- Harder to debug

### Event System (Pub/Sub)

```typescript
eventBus.emit("task:completed", { taskId });
eventBus.on("task:completed", orchestrator.handleTaskComplete);
```

**Considered but deferred because:**
- Adds infrastructure complexity
- Message posting achieves same goal more simply
- Can add event bus later if needed for non-agent subscribers

---

## Consequences

### Positive

- **Consistency** — All coordination uses the same message model
- **Traceability** — Every notification is in the audit trail
- **Simplicity** — No new infrastructure, just message posting
- **Flexibility** — Any session can receive hook messages

### Negative

- **Agent dependency** — Orchestrator must be running to receive messages
- **No guaranteed delivery** — If session crashes, messages may be lost
- **Prompt engineering** — Orchestrator must be prompted to handle hook messages

### Mitigations

- **Session persistence** — Messages are persisted to workflow state
- **Session recovery** — On restart, orchestrator sees missed messages
- **Clear message format** — Hook messages are clearly marked for easy parsing

---

## Implementation Notes

1. **Add `"hook"` to message roles** — Distinguish hook messages from others
2. **Extend `post_message` hook action** — Target can be `orchestrator`, `control`, or session ID
3. **Update orchestrator prompt** — Include instructions for handling hook messages
4. **Message persistence** — Ensure hook messages are saved to workflow state
5. **Session targeting** — Implement session lookup by role or ID

---

## Related Decisions

- ADR-010: Agent Runtime Architecture
- ADR-011: Workflow Orchestration
