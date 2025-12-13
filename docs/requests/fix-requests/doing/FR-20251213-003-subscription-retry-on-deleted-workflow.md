# Fix Request: Subscription Continuously Retries for Deleted Workflows

**ID**: FR-20251213-003  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: medium  
**Owner**: agent  

---

## Problem

When viewing a workflow chat page for a workflow that has been deleted or doesn't exist, the `useWorkflowMessages` hook continuously retries the subscription every second, flooding the server with requests and logging errors.

---

## Expected Behavior

When a workflow is not found (NOT_FOUND error), the subscription should stop retrying and display the "Workflow not found" UI without further polling.

---

## Actual Behavior

The subscription error handler sets a 1-second retry timer regardless of error type, causing continuous polling:
```
❌ tRPC failed on workflow.onMessage: Workflow not found: WF-20251213-001
```

---

## Steps to Reproduce

1. Navigate to `/chat/WF-NONEXISTENT-001` (a workflow ID that doesn't exist)
2. Observe continuous server requests every second
3. Server logs show repeated "Workflow not found" errors

---

## Root Cause Analysis

The `onError` handler in `useWorkflowMessages` hook always scheduled a retry after 1 second, without checking if the error was a permanent NOT_FOUND error that shouldn't be retried.

---

## Proposed Fix

Detect NOT_FOUND errors in the subscription error handler and skip the retry timer for these permanent errors.

---

## Affected Files

- `packages/web/src/hooks/use-workflow-messages.ts`

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
