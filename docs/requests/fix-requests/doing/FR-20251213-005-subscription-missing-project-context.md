# Fix Request: Subscription Missing Project Context (WebSocket Migration)

**ID**: FR-20251213-005  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: high  
**Owner**: agent  

---

## Problem

tRPC subscriptions fail with "Workflow not found" because the `x-choragen-project-root` header isn't sent. The current `unstable_httpSubscriptionLink` uses Server-Sent Events (SSE), which doesn't support custom HTTP headers. The subscription falls back to `process.cwd()` instead of the user's selected project.

---

## Expected Behavior

Subscriptions should receive the same project context as regular queries/mutations, allowing workflows to be found in the correct project directory.

---

## Actual Behavior

- Regular requests via `httpBatchLink` send `x-choragen-project-root` header ✓
- Subscriptions via `unstable_httpSubscriptionLink` (SSE) cannot send custom headers ✗
- Server falls back to `process.cwd()` for subscriptions
- Workflows created in `day-planner-test` can't be found by subscriptions looking in `choragen`

---

## Root Cause Analysis

SSE (EventSource API) doesn't support custom HTTP headers. The `eventSourceOptions.headers` in tRPC's `unstable_httpSubscriptionLink` doesn't work because the underlying browser API doesn't support it.

---

## Proposed Fix

Migrate from SSE to WebSocket transport for tRPC subscriptions.

### Changes Required

1. **Add WebSocket server** to Next.js app
   - Create WebSocket handler in `packages/web/src/server/ws.ts`
   - Configure Next.js to support WebSocket upgrade

2. **Update tRPC client** in `packages/web/src/lib/trpc/provider.tsx`
   - Replace `unstable_httpSubscriptionLink` with `wsLink`
   - Configure WebSocket URL with project context

3. **Update tRPC server** configuration
   - Add WebSocket adapter for tRPC
   - Ensure context creation works for WebSocket connections

4. **Handle project context in WebSocket**
   - Pass project root as connection parameter or in first message
   - Store in WebSocket connection context

### Implementation Notes

- tRPC v11 supports WebSocket via `@trpc/client` `wsLink`
- Next.js 14 requires custom server or API route for WebSocket
- Consider using `ws` package for WebSocket server
- Project context can be passed as query param on WebSocket URL: `ws://localhost:3000/api/trpc?projectRoot=/path/to/project`

---

## Affected Files

- `packages/web/src/lib/trpc/provider.tsx` - Client link configuration
- `packages/web/src/server/context.ts` - Context creation for WS
- `packages/web/src/app/api/trpc/[trpc]/route.ts` - May need WS handler
- `packages/web/package.json` - Add `ws` dependency if needed
- `packages/web/next.config.mjs` - WebSocket configuration

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Linked Design Docs

- `docs/design/core/features/web-chat-interface.md`

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Subscriptions work with correct project context
- [ ] Existing queries/mutations still work
- [ ] WebSocket reconnection handles gracefully
- [ ] Tests added for WebSocket transport

---

## Completion Notes

[Added when moved to done/]
