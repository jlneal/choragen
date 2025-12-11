# Task: Integrate tRPC subscription for real-time message updates

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 008-008-realtime-subscription  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Integrate the tRPC `workflow.onMessage` subscription to enable real-time message updates in the chat interface. Messages should appear immediately as agents respond.

---

## Expected Files

- `packages/web/src/hooks/use-workflow-messages.ts — Custom hook for subscription management`
- `Update packages/web/src/components/chat/chat-container.tsx — Use subscription hook`

---

## Acceptance Criteria

- [ ] useWorkflowMessages hook manages subscription lifecycle
- [ ] Initial message backlog loads immediately on mount
- [ ] New messages appear in real-time without page refresh
- [ ] Subscription cleans up properly on unmount
- [ ] Error handling for subscription failures
- [ ] Reconnection logic if subscription drops
- [ ] Messages deduplicated (no duplicates from backlog + live)
- [ ] Unit tests for useWorkflowMessages hook

---

## Notes

The `workflow.onMessage` subscription yields existing messages first (backlog), then streams new messages.

Use tRPC's `useSubscription` hook pattern. Handle the async generator properly.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
