# Task: Implement MetricsCollector in Core

**ID**: 003-implement-collector  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Implement the core MetricsCollector class that records and queries events.

## API Design

```typescript
class MetricsCollector {
  constructor(projectRoot: string);
  
  // Recording
  record(event: Omit<PipelineEvent, 'id' | 'timestamp'>): Promise<void>;
  
  // Querying
  getEvents(filter?: EventFilter): Promise<PipelineEvent[]>;
  
  // Aggregations
  getTaskMetrics(options?: MetricsOptions): Promise<TaskMetrics>;
  getChainMetrics(options?: MetricsOptions): Promise<ChainMetrics>;
  getReworkMetrics(options?: MetricsOptions): Promise<ReworkMetrics>;
}

interface EventFilter {
  since?: Date;
  until?: Date;
  eventType?: EventType | EventType[];
  chainId?: string;
  requestId?: string;
}

interface MetricsOptions {
  since?: Date;
  chainId?: string;
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  avgCycleTimeMs: number;
  p50CycleTimeMs: number;
  p90CycleTimeMs: number;
}

interface ReworkMetrics {
  totalReworks: number;
  reworkRate: number;           // 0-1
  firstTimeRightRate: number;   // 0-1
  avgReworkIterations: number;
}
```

## Implementation Details

- Read/append to `.choragen/metrics/events.jsonl`
- Generate UUID for event ID
- Use ISO 8601 for timestamps
- Calculate aggregates on-demand (no caching initially)

## Files to Create

- `packages/core/src/metrics/metrics-collector.ts`
- `packages/core/src/metrics/__tests__/metrics-collector.test.ts`

## Acceptance Criteria

- [ ] MetricsCollector class implemented
- [ ] `record()` appends to JSONL file
- [ ] `getEvents()` reads and filters events
- [ ] Aggregation methods calculate correct metrics
- [ ] Unit tests cover recording and querying
- [ ] Handles missing metrics directory gracefully
