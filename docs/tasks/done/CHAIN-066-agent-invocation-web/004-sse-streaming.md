# Task: SSE Streaming for Agent Responses

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 004  
**Type**: impl  
**Status**: done  
**Depends On**: 003

---

## Objective

Implement Server-Sent Events (SSE) streaming to push agent responses to the client in real-time.

---

## Acceptance Criteria

- [ ] SSE endpoint created for agent message streaming
- [ ] Agent subprocess output parsed into structured events
- [ ] Events include: message, tool_call, tool_result, error, done
- [ ] Client receives events as they occur
- [ ] Connection cleanup on client disconnect

---

## Implementation Notes

**Server side**: `packages/web/src/app/api/agent-stream/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to agent session events
      // Push events to controller
    },
    cancel() {
      // Cleanup on disconnect
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Client side**: `packages/web/src/lib/agent-stream.ts`

```typescript
export function subscribeToAgentStream(sessionId: string, handlers: {
  onMessage: (msg: AgentMessage) => void;
  onToolCall: (call: ToolCall) => void;
  onError: (err: Error) => void;
  onDone: () => void;
}) {
  const eventSource = new EventSource(`/api/agent-stream?sessionId=${sessionId}`);
  // Wire up handlers
  return () => eventSource.close();
}
```

---

## Verification

```bash
pnpm --filter @choragen/web test
# Manual: trigger agent, verify events stream to client
```
