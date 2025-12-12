# Task: Enable Chat Input

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 001  
**Type**: impl  
**Status**: done  
**Depends On**: none

---

## Objective

Enable the chat input component that is currently disabled with "Coming Soon" placeholder. Wire it to send human messages to the workflow.

---

## Acceptance Criteria

- [ ] Chat input is enabled and accepts user text
- [ ] Sending a message calls `workflow.sendMessage` mutation
- [ ] Message appears in chat history immediately
- [ ] Input clears after successful send
- [ ] Disabled state while sending (prevent double-submit)

---

## Implementation Notes

**File**: `packages/web/src/components/chat/chat-input.tsx`

The input is currently disabled. Enable it and wire to the existing `sendMessage` mutation in the workflow router.

```typescript
// Current state: disabled with placeholder
// Target: functional input that sends human messages
```

---

## Verification

```bash
pnpm --filter @choragen/web dev
# Navigate to a workflow chat
# Type message and submit
# Verify message appears in history
```
