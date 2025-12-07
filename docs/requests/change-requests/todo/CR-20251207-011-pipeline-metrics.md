# Change Request: Pipeline Metrics System

**ID**: CR-20251207-011  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Add a metrics subsystem to track performance across the entire pipeline: tasks, chains, requests, and agents. Local-first storage with future extensibility for hosted/shared metrics.

## Motivation

Currently there's no visibility into:
- Task completion time
- Rework rates
- Chain throughput
- Request cycle time
- Agent performance over time

Without metrics, we can't:
- Identify bottlenecks
- Measure improvement
- Compare agent effectiveness
- Predict delivery timelines

## Proposed Changes

### Event Model

All pipeline activities emit events:

```typescript
interface PipelineEvent {
  id: string;
  timestamp: string;        // ISO 8601
  eventType: EventType;
  entityType: 'task' | 'chain' | 'request';
  entityId: string;
  chainId?: string;
  requestId?: string;
  agentId?: string;         // Which agent performed action
  metadata?: Record<string, unknown>;
}

type EventType = 
  | 'task:created'
  | 'task:started'
  | 'task:completed'
  | 'task:rework'           // From CR-010
  | 'chain:created'
  | 'chain:completed'
  | 'request:created'
  | 'request:closed';
```

### Storage (Local-First)

```
.choragen/
├── config.yaml
├── locks.json
└── metrics/
    ├── events.jsonl        # Append-only event log
    └── aggregates.json     # Pre-computed metrics
```

**Why JSONL**: 
- Append-only is simple and corruption-resistant
- Easy to parse incrementally
- Can migrate to SQLite later if needed

### CLI Commands

```bash
# View metrics summary
choragen metrics:summary [--since 7d] [--chain <id>]

# View specific metrics
choragen metrics:tasks [--status done|rework] [--agent <id>]
choragen metrics:chains [--status active|done]
choragen metrics:requests [--type cr|fr]

# Export for analysis
choragen metrics:export --format json|csv --output metrics.json
```

### Key Metrics

| Metric | Description | Aggregation |
|--------|-------------|-------------|
| Task Cycle Time | Time from started → completed | avg, p50, p90 |
| Rework Rate | Rework tasks / total tasks | percentage |
| Chain Throughput | Tasks completed per day | count/day |
| Request Cycle Time | Created → closed | avg, p50, p90 |
| First-Time Success | Tasks completed without rework | percentage |

### Integration Points

Events are emitted by existing commands:
- `task:start` → `task:started`
- `task:complete` → `task:completed`
- `task:rework` → `task:rework` (CR-010)
- `chain:new` → `chain:created`
- `request:close` → `request:closed`

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | New `MetricsCollector`, event types |
| `@choragen/cli` | New `metrics:*` commands, event emission in existing commands |

## Acceptance Criteria

- [ ] Events logged to `.choragen/metrics/events.jsonl`
- [ ] `metrics:summary` shows key metrics
- [ ] Rework rate calculable from events
- [ ] Export to JSON/CSV works
- [ ] No performance impact on normal operations

## Dependencies

- CR-20251207-010 (Task Rework) - for rework events

## Design Docs

- `docs/design/core/features/pipeline-metrics.md` (to be created)

## ADR Required

Yes - ADR for metrics storage format and aggregation strategy

---

## Commits

[Populated by `choragen request:close`]
