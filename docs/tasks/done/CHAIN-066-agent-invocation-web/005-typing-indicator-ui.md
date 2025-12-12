# Task: Typing Indicator UI

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 005  
**Type**: impl  
**Status**: done  
**Depends On**: 004

---

## Objective

Display a typing indicator while the agent is processing, transitioning to the actual message when complete.

---

## Acceptance Criteria

- [ ] Typing indicator appears when agent session starts
- [ ] Indicator shows agent role (control/impl)
- [ ] Indicator animates (dots or similar)
- [ ] Transitions smoothly to actual message content
- [ ] Disappears on error or completion

---

## Implementation Notes

**File**: `packages/web/src/components/chat/typing-indicator.tsx`

```tsx
interface TypingIndicatorProps {
  role: "control" | "impl";
  isVisible: boolean;
}

export function TypingIndicator({ role, isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null;
  
  return (
    <div className="flex items-center gap-2 p-3 text-muted-foreground">
      <span className="text-sm">{role} is thinking</span>
      <span className="animate-pulse">...</span>
    </div>
  );
}
```

**Integration**: Wire into chat message list, show when agent stream is active but no content yet.

---

## Verification

```bash
pnpm --filter @choragen/web dev
# Trigger agent, verify typing indicator appears
# Verify it transitions to message content
```
