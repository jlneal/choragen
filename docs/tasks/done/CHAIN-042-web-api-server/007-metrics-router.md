# Task: Implement metrics router for metrics queries

**Chain**: CHAIN-042-web-api-server  
**Task**: 007-metrics-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the metrics tRPC router for querying pipeline metrics using `MetricsCollector` from `@choragen/core`. This router exposes task, chain, and rework metrics to the web dashboard.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── metrics.ts             # Metrics router for pipeline metrics`
- `└── index.ts               # Updated to include metricsRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/metrics.ts created with procedures:
- [ ] - getEvents - query: returns pipeline events with optional filters
- [ ] - getTaskMetrics - query: returns task-level metrics (cycle times, completion)
- [ ] - getChainMetrics - query: returns chain-level metrics (counts, avg tasks)
- [ ] - getReworkMetrics - query: returns rework metrics (rates, iterations)
- [ ] - getSummary - query: returns combined summary of all metrics
- [ ] Zod schemas for filter inputs
- [ ] metricsRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**MetricsCollector API** (from `@choragen/core`):
```typescript
import { MetricsCollector, type EventFilter, type MetricsOptions } from '@choragen/core';

const collector = new MetricsCollector(ctx.projectRoot);

// Query events
collector.getEvents(filter?: EventFilter): Promise<PipelineEvent[]>

// Aggregated metrics
collector.getTaskMetrics(options?: MetricsOptions): Promise<TaskMetrics>
collector.getChainMetrics(options?: MetricsOptions): Promise<ChainMetrics>
collector.getReworkMetrics(options?: MetricsOptions): Promise<ReworkMetrics>
```

**EventFilter**:
```typescript
interface EventFilter {
  since?: Date;
  until?: Date;
  eventType?: EventType | EventType[];
  chainId?: string;
  requestId?: string;
}
```

**MetricsOptions**:
```typescript
interface MetricsOptions {
  since?: Date;
  chainId?: string;
}
```

**Metric Types**:
- `TaskMetrics`: totalTasks, completedTasks, avgCycleTimeMs, p50CycleTimeMs, p90CycleTimeMs
- `ChainMetrics`: totalChains, completedChains, avgTasksPerChain
- `ReworkMetrics`: totalReworks, reworkRate, firstTimeRightRate, avgReworkIterations

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
