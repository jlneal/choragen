# Fix Request: Agent Stream Session Not Found (404)

**ID**: FR-20251213-006  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: high  
**Owner**: agent  

---

## Problem

When invoking an agent in the chat interface, the `/api/agent-stream` endpoint returns 404 "Session not found" even though `workflow.invokeAgent` successfully spawned the agent session.

---

## Expected Behavior

After `workflow.invokeAgent` spawns an agent session and returns a `sessionId`, the client should be able to connect to `/api/agent-stream?sessionId=...` and receive the SSE stream of agent output.

---

## Actual Behavior

```
POST /api/trpc/workflow.invokeAgent?batch=1 200 in 4ms
GET /api/agent-stream?sessionId=session-1765655864285-lyzq748 404 in 229ms
```

The session is created but immediately not found when the stream endpoint is called.

---

## Root Cause Analysis

The `activeSessions` Map in `packages/web/src/lib/agent-subprocess.ts` is an in-memory data structure. In Next.js App Router:

1. `workflow.invokeAgent` (tRPC route) calls `spawnAgentSession()` which adds to `activeSessions`
2. `/api/agent-stream` (API route) calls `getSession()` which reads from `activeSessions`
3. **These are separate module instances** - Next.js treats each API route as an isolated serverless function

Even with the custom server (`server.ts`), Next.js App Router API routes are still isolated. The in-memory map is not shared between them.

---

## Proposed Fix

### Option A: Move agent spawning to custom server (Recommended)

Move the agent session management out of Next.js API routes and into the custom server:

1. Create a singleton session manager in `server.ts` that persists across requests
2. Expose session operations via the custom HTTP server (not Next.js routes)
3. Have the tRPC route communicate with the session manager via IPC or direct import

### Option B: Use external session store

Use Redis, SQLite, or file-based storage for session metadata:

1. Store session info (pid, workflowId, stageIndex) in external store
2. `/api/agent-stream` looks up session and attaches to the process

### Option C: Consolidate into single endpoint

Combine `invokeAgent` and `agent-stream` into a single SSE endpoint:

1. Client calls `/api/agent-stream?workflowId=...&message=...`
2. Endpoint spawns agent and streams output in one request
3. No need for session lookup

---

## Affected Files

- `packages/web/src/lib/agent-subprocess.ts`
- `packages/web/src/server/routers/workflow.ts`
- `packages/web/src/app/api/agent-stream/route.ts`
- `packages/web/server.ts`

---

## Linked ADRs

- ADR-010-agent-runtime-architecture
- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Agent invocation works end-to-end
- [ ] Agent output streams to chat interface
- [ ] Multiple concurrent sessions work correctly

---

## Completion Notes

[Added when moved to done/]
