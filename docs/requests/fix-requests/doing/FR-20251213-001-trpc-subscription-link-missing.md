# Fix Request: tRPC Subscription Link Missing

**ID**: FR-20251213-001  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: high  
**Owner**: agent  

---

## Problem

The tRPC client configuration only uses `httpBatchLink`, which does not support subscriptions. When the workflow chat page attempts to use `trpc.workflow.onMessage.useSubscription()`, it throws a runtime error.

---

## Expected Behavior

The workflow chat page should successfully subscribe to real-time message updates via the `onMessage` subscription procedure.

---

## Actual Behavior

Runtime error is thrown:
```
Error: Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`
```

---

## Steps to Reproduce

1. Navigate to the workflow chat page
2. The page attempts to subscribe to `trpc.workflow.onMessage`
3. Error is thrown because `httpBatchLink` doesn't support subscriptions

---

## Root Cause Analysis

The tRPC client in `packages/web/src/lib/trpc/provider.tsx` only configures `httpBatchLink` in the links array. Subscriptions require either `httpSubscriptionLink` (for SSE-based subscriptions) or `wsLink` (for WebSocket-based subscriptions).

---

## Proposed Fix

Add `httpSubscriptionLink` to the tRPC client configuration using `splitLink` to route subscription operations to the subscription link while keeping regular queries/mutations on `httpBatchLink`.

---

## Affected Files

- `packages/web/src/lib/trpc/provider.tsx`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Completion Notes

[Added when moved to done/]
