# Task: Error Handling and Retry

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 009  
**Type**: impl  
**Status**: done  
**Depends On**: 004

---

## Objective

Handle agent session errors gracefully with clear error display and retry option.

---

## Acceptance Criteria

- [ ] Agent errors displayed in chat with clear message
- [ ] Error includes context (what failed, why)
- [ ] "Retry" button available on error
- [ ] Retry re-invokes agent for same context
- [ ] API key errors show helpful message (link to settings)

---

## Implementation Notes

**Error types to handle**:
- API key missing/invalid → "Configure API key in Settings"
- Rate limit → "Rate limited, try again in X seconds"
- Network error → "Connection failed, check network"
- Agent crash → "Agent session failed unexpectedly"
- Timeout → "Agent session timed out"

**File**: `packages/web/src/components/chat/error-message.tsx`

```tsx
interface ErrorMessageProps {
  error: AgentError;
  onRetry: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="border-destructive border rounded-md p-3 bg-destructive/10">
      <p className="text-destructive font-medium">{error.title}</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      {error.action && (
        <Link href={error.action.href} className="text-sm underline">
          {error.action.label}
        </Link>
      )}
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
```

---

## Verification

```bash
pnpm --filter @choragen/web dev
# Test with missing API key
# Test with invalid API key
# Verify error displays and retry works
```
