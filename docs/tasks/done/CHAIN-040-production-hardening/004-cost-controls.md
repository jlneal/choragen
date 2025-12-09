# Task: Implement Cost Controls

**ID**: 004-cost-controls  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Implement token and cost limits to prevent runaway agent sessions from burning through API credits.

---

## Acceptance Criteria

- [ ] Add `--max-tokens <number>` flag to `agent:start` command
- [ ] Add `--max-cost <number>` flag to `agent:start` command (USD)
- [ ] Track token usage per turn and cumulative
- [ ] Warn at 80% of limit (log warning, continue)
- [ ] Hard stop at 100% of limit (graceful shutdown)
- [ ] Display running cost in session output
- [ ] Session summary shows total tokens and estimated cost
- [ ] Support `CHORAGEN_MAX_TOKENS` and `CHORAGEN_MAX_COST` env vars
- [ ] Add unit tests for cost tracking and limits

---

## Implementation Notes

### Cost Estimation

```typescript
// Approximate costs per 1M tokens (as of late 2024)
const COST_PER_MILLION_TOKENS = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
};
```

### Cost Tracker

```typescript
class CostTracker {
  private maxTokens?: number;
  private maxCost?: number;
  private tokensUsed = { input: 0, output: 0 };
  
  addUsage(input: number, output: number): void;
  getEstimatedCost(): number;
  checkLimits(): { warning: boolean; exceeded: boolean };
}
```

### Output Format

```
Turn 5 | Tokens: 12,450 (in: 8,200, out: 4,250) | Cost: $0.18 | Limit: 80% ⚠️
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/cost-tracker.ts` (create)
- `packages/cli/src/runtime/loop.ts` (modify - integrate cost tracking)
- `packages/cli/src/commands/agent/start.ts` (modify - add flags)
- `packages/cli/src/__tests__/cost-tracker.test.ts` (create)
