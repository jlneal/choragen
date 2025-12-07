# Task: Add Event Emission to CLI Commands

**ID**: 004-emit-events  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Update existing CLI commands to emit metrics events when actions occur.

## Commands to Update

| Command | Event | Additional Data |
|---------|-------|-----------------|
| `task:start` | `task:started` | chainId, taskId |
| `task:complete` | `task:completed` | chainId, taskId, --tokens, --model |
| `task:rework` | `task:rework` | chainId, taskId, originalTaskId |
| `chain:new` | `chain:created` | chainId, requestId |
| `request:close` | `request:closed` | requestId |

## New Flags

Add to `task:complete`:

```bash
choragen task:complete <chain-id> <task-id> [--tokens <input>,<output>] [--model <name>]
```

Examples:
```bash
choragen task:complete CHAIN-031 003 --tokens 5000,2000 --model claude-3.5-sonnet
choragen task:complete CHAIN-031 003  # No token tracking
```

## Implementation

```typescript
// In task:complete handler
await metricsCollector.record({
  eventType: 'task:completed',
  entityType: 'task',
  entityId: taskId,
  chainId,
  model: options.model,
  tokens: options.tokens ? parseTokens(options.tokens) : undefined,
});
```

## Files to Modify

- `packages/cli/src/cli.ts` - Add flags and event emission
- `packages/cli/src/commands/*.ts` - Individual command updates

## Acceptance Criteria

- [ ] `task:start` emits `task:started`
- [ ] `task:complete` emits `task:completed` with optional tokens/model
- [ ] `task:rework` emits `task:rework`
- [ ] `chain:new` emits `chain:created`
- [ ] `request:close` emits `request:closed`
- [ ] Events written to `.choragen/metrics/events.jsonl`
- [ ] Commands work without metrics (graceful if dir missing)
