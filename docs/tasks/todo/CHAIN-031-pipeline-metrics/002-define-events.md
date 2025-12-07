# Task: Define Event Types and Storage

**ID**: 002-define-events  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Define TypeScript types for pipeline events and the storage format.

## Event Schema

```typescript
interface PipelineEvent {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  eventType: EventType;
  entityType: 'task' | 'chain' | 'request';
  entityId: string;
  chainId?: string;
  requestId?: string;
  model?: string;                // e.g., "claude-3.5-sonnet"
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, unknown>;
}

type EventType = 
  | 'task:started'
  | 'task:completed'
  | 'task:rework'
  | 'chain:created'
  | 'chain:completed'
  | 'request:created'
  | 'request:closed';
```

## Storage Structure

```
.choragen/
├── config.yaml
├── locks.json
└── metrics/
    ├── events.jsonl        # Append-only event log
    └── aggregates.json     # Pre-computed metrics (optional cache)
```

## Files to Create

- `packages/core/src/metrics/types.ts` - Event types
- `packages/core/src/metrics/index.ts` - Exports

## Acceptance Criteria

- [ ] PipelineEvent type defined
- [ ] EventType union covers all events
- [ ] Types exported from core
- [ ] Storage paths documented
