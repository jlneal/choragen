# ADR-009: Pipeline Metrics System

**Status**: doing  
**Created**: 2025-12-07  
**Linked CR/FR**: CR-20251207-011  
**Linked Design Docs**: docs/design/core/features/pipeline-metrics.md

---

## Context

Choragen manages development work through task chains, requests, and governance. Currently there's no visibility into pipeline performance:

- How long do tasks take?
- What's the rework rate?
- Which chains are bottlenecked?
- How do agents perform over time?

Without metrics, we cannot identify process improvements, predict delivery timelines, or measure the impact of changes.

The metrics system must be:
1. **Local-first**: Works offline, no external dependencies
2. **Append-only**: Simple, corruption-resistant, auditable
3. **Extensible**: Can add new event types without migration
4. **Queryable**: Supports common aggregations efficiently

---

## Decision

### Event-Sourced Model

All pipeline activities are recorded as immutable events in an append-only log. Current state is derived by replaying events, not stored directly.

**Why event sourcing**:
- Complete audit trail of all pipeline activity
- Can reconstruct state at any point in time
- New aggregations can be computed from historical events
- Natural fit for distributed/async workflows

### Storage Format

```
.choragen/
├── config.yaml
├── locks.json
└── metrics/
    ├── events.jsonl        # Append-only event log
    └── aggregates.json     # Pre-computed metrics cache
```

**JSONL for events**:
- One JSON object per line, newline-delimited
- Append-only writes are atomic (single write syscall)
- Easy to stream/parse incrementally
- Human-readable for debugging
- Can `tail -f` for real-time monitoring

**JSON for aggregates**:
- Pre-computed metrics for fast queries
- Rebuilt on demand from events
- Cache invalidated when events.jsonl changes

### Event Schema

```typescript
interface PipelineEvent {
  id: string;              // UUID v4
  timestamp: string;       // ISO 8601 with timezone
  eventType: EventType;
  entityType: 'task' | 'chain' | 'request';
  entityId: string;
  chainId?: string;        // For task events
  requestId?: string;      // Linked CR/FR
  agent?: AgentInfo;       // Who performed the action
  metadata?: Record<string, unknown>;
}

interface AgentInfo {
  model: string;           // e.g., "claude-3-5-sonnet-20241022"
  role: 'control' | 'impl';
  tokens?: TokenUsage;     // Optional, manual for now
}

interface TokenUsage {
  input: number;
  output: number;
}

type EventType = 
  | 'task:created'
  | 'task:started'
  | 'task:completed'
  | 'task:rework'
  | 'chain:created'
  | 'chain:completed'
  | 'request:created'
  | 'request:closed';
```

### Example Events

```jsonl
{"id":"a1b2c3","timestamp":"2025-12-07T10:00:00Z","eventType":"chain:created","entityType":"chain","entityId":"CHAIN-031","requestId":"CR-20251207-011","agent":{"model":"claude-3-5-sonnet","role":"control"}}
{"id":"d4e5f6","timestamp":"2025-12-07T10:05:00Z","eventType":"task:created","entityType":"task","entityId":"001-create-adr","chainId":"CHAIN-031"}
{"id":"g7h8i9","timestamp":"2025-12-07T10:10:00Z","eventType":"task:started","entityType":"task","entityId":"001-create-adr","chainId":"CHAIN-031","agent":{"model":"claude-3-5-sonnet","role":"impl"}}
{"id":"j0k1l2","timestamp":"2025-12-07T10:30:00Z","eventType":"task:completed","entityType":"task","entityId":"001-create-adr","chainId":"CHAIN-031","agent":{"model":"claude-3-5-sonnet","role":"impl"}}
```

### Aggregation Strategy

Aggregates are computed lazily and cached in `aggregates.json`:

```typescript
interface MetricsAggregate {
  computedAt: string;
  eventCount: number;
  lastEventId: string;
  
  // Task metrics
  tasks: {
    total: number;
    completed: number;
    reworked: number;
    avgCycleTimeMs: number;
    p50CycleTimeMs: number;
    p90CycleTimeMs: number;
  };
  
  // Chain metrics
  chains: {
    total: number;
    completed: number;
    avgTasksPerChain: number;
  };
  
  // Request metrics
  requests: {
    total: number;
    closed: number;
    avgCycleTimeMs: number;
  };
  
  // Agent metrics (by model)
  agents: Record<string, {
    tasksCompleted: number;
    reworkRate: number;
    avgCycleTimeMs: number;
    totalTokens?: { input: number; output: number };
  }>;
}
```

**Recomputation triggers**:
- On `metrics:summary` if events.jsonl modified since last computation
- On `metrics:refresh` command (force rebuild)
- Never automatically in background (local-first, no daemons)

### Historical Import

For existing projects, events can be reconstructed from git history:

```bash
choragen metrics:import --from-git
```

This command:
1. Scans git log for task/chain file movements
2. Infers events from file state changes
3. Uses commit timestamps for event timestamps
4. Marks imported events with `source: "git-import"`

**Limitations**:
- Agent info not available (no model tracking in git)
- Token usage not available
- Timing precision limited to commit granularity

### Identity Tracking

Agent identity is tracked by model name, not session or user:

- `claude-3-5-sonnet-20241022` - specific model version
- `gpt-4-turbo` - different model

This enables:
- Comparing model effectiveness
- Tracking performance across model versions
- No PII concerns (model names are not personal data)

### Token Tracking

Token usage is **optional and manual** in v1:

```bash
choragen task:complete 001-create-adr --tokens-in 5000 --tokens-out 2000
```

Future enhancement: automated token tracking via API integration.

---

## Consequences

**Positive**:
- Complete audit trail of all pipeline activity
- Can answer "what happened" at any point in history
- New metrics can be derived without schema migration
- Works offline, no external dependencies
- Simple append-only model is corruption-resistant
- Human-readable format aids debugging

**Negative**:
- Event log grows unbounded (no automatic compaction)
- Aggregate computation is O(n) on event count
- No real-time queries (must scan full log)
- Token tracking requires manual input initially

**Mitigations**:
- Add `metrics:compact` command for archiving old events
- Cache aggregates aggressively, only recompute on change
- For large logs, consider SQLite migration (future ADR)
- Automate token tracking when API support available

---

## Alternatives Considered

### Alternative 1: SQLite Database

Store events and aggregates in a SQLite database.

**Rejected because**:
- More complex setup and dependencies
- Harder to inspect/debug manually
- Overkill for expected event volume (<10k events/project)
- Can migrate later if needed (events are the source of truth)

### Alternative 2: Mutable State Files

Track current metrics in mutable JSON files, updated on each action.

**Rejected because**:
- Loses historical information
- Cannot reconstruct past state
- Race conditions with concurrent updates
- No audit trail

### Alternative 3: External Metrics Service

Send events to an external service (e.g., hosted analytics).

**Rejected because**:
- Violates local-first principle
- Requires network connectivity
- Privacy concerns with project data
- Can add as optional export later

---

## Implementation

[Added when moved to done/]

- `packages/core/src/metrics/event-store.ts`
- `packages/core/src/metrics/aggregator.ts`
- `packages/cli/src/commands/metrics-summary.ts`
- `packages/cli/src/commands/metrics-import.ts`
