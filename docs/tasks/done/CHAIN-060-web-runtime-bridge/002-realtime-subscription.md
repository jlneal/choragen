# Task: Add workflow.onMessage tRPC subscription for real-time message streaming

**Chain**: CHAIN-060-web-runtime-bridge  
**Task**: 002-realtime-subscription  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add a tRPC subscription endpoint `workflow.onMessage` that streams new messages in real-time as they are added to a workflow. This enables the chat UI to receive live updates without polling.



---

## Expected Files

- `packages/web/src/server/routers/workflow.ts` — Add `onMessage` subscription
- `packages/web/src/__tests__/routers/workflow.test.ts` — Add subscription tests
- `packages/core/src/workflow/events.ts` — (if needed) Event emitter for workflow messages


---

## Acceptance Criteria

- [x] `workflow.onMessage` subscription added to workflowRouter
- [x] Subscription accepts `{ workflowId }` input
- [x] Yields existing messages on initial connection (backlog emit)
- [x] Yields new messages as they are added via `sendMessage` (poll-based)
- [x] Properly cleans up on client disconnect (cancellable delay)
- [x] Tests verify subscription behavior (3 new tests)
- [x] `pnpm --filter @choragen/web typecheck` passes


---

## Notes

### tRPC Subscription Pattern

tRPC v11 uses async generators for subscriptions:

```typescript
import { observable } from "@trpc/server/observable";

onMessage: publicProcedure
  .input(z.object({ workflowId: z.string() }))
  .subscription(async function* ({ input, ctx }) {
    // Yield existing messages
    const workflow = await getWorkflow(input.workflowId);
    for (const msg of workflow.messages) {
      yield msg;
    }
    
    // Subscribe to new messages (needs event system)
    // ...
  })
```

### Event System Options

1. **Simple polling approach** — Poll workflow for new messages (simpler, less real-time)
2. **EventEmitter in WorkflowManager** — Emit events when messages added
3. **File watcher** — Watch workflow JSON file for changes

Start with option 1 (polling) for simplicity. Can upgrade to EventEmitter later.

### Reference

- tRPC subscriptions: https://trpc.io/docs/subscriptions
- Design doc: `docs/design/core/features/web-chat-interface.md` (lines 230-261)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
