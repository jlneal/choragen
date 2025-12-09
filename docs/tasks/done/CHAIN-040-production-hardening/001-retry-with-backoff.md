# Task: Implement Retry with Exponential Backoff

**ID**: 001-retry-with-backoff  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Implement automatic retry with exponential backoff for failed tool calls and LLM API errors.

---

## Acceptance Criteria

- [ ] Create `packages/cli/src/runtime/retry.ts` with retry logic
- [ ] Implement exponential backoff: 1s, 2s, 4s, 8s (max 3 retries)
- [ ] Retry on transient errors (network, rate limit, 5xx)
- [ ] Do NOT retry on permanent errors (4xx except 429)
- [ ] Integrate retry into `loop.ts` for LLM calls
- [ ] Integrate retry into tool executor for tool calls
- [ ] Add `--no-retry` flag to disable retry behavior
- [ ] Add unit tests for retry logic

---

## Implementation Notes

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;      // Default: 3
  baseDelayMs: number;     // Default: 1000
  maxDelayMs: number;      // Default: 30000
  retryableErrors: Set<string>;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
```

### Usage Pattern

```typescript
const result = await withRetry(
  () => provider.complete(messages, tools),
  { maxRetries: 3, baseDelayMs: 1000 }
);
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/retry.ts` (create)
- `packages/cli/src/runtime/loop.ts` (modify - wrap LLM calls)
- `packages/cli/src/runtime/tools/executor.ts` (modify - wrap tool execution)
- `packages/cli/src/__tests__/retry.test.ts` (create)
