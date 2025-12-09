# Change Request: Metrics Dashboard

**ID**: CR-20251208-006  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Implement the metrics dashboard with charts, trends, and key performance indicators for the Choragen pipeline.

---

## Motivation

Users need visibility into pipeline health and performance:
- Task completion rates and cycle times
- Rework rates and trends
- Agent performance metrics
- Cost tracking for agent sessions

---

## Scope

**In Scope**:
- Metrics overview page with KPI cards
- Task metrics (cycle time, completion rate)
- Rework metrics (rate, trends)
- Agent session metrics (tokens, cost)
- Time-based filtering (7d, 30d, 90d, all)
- Charts for trends

**Out of Scope**:
- Custom metric definitions
- Export functionality
- Alerting/notifications

---

## Proposed Changes

### Metrics Page

```
/metrics
┌─────────────────────────────────────────────────────────────┐
│  Metrics                              [7d] [30d] [90d] [All]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Key Metrics                                                │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Tasks Done  │ │ Rework Rate │ │ Avg Cycle   │           │
│  │    127      │ │    8.2%     │ │   2.4 hrs   │           │
│  │   ↑ 12%     │ │   ↓ 3%      │ │   ↓ 15%     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Chains Done │ │ Total Cost  │ │ Tokens Used │           │
│  │     23      │ │   $47.82    │ │   2.1M      │           │
│  │   ↑ 8%      │ │   ↑ 22%     │ │   ↑ 18%     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Task Completion Trend                                      │
│  ─────────────────────────────────────────────────────────  │
│       ╭──────────────────────────────────────────╮          │
│   20 ─┤                              ╭───╮       │          │
│   15 ─┤              ╭───╮     ╭───╮ │   │ ╭───╮ │          │
│   10 ─┤    ╭───╮ ╭───┤   ├───╮ │   │ │   │ │   │ │          │
│    5 ─┤╭───┤   │ │   │   │   │ │   │ │   │ │   │ │          │
│    0 ─┴┴───┴───┴─┴───┴───┴───┴─┴───┴─┴───┴─┴───┴─╯          │
│        Mon  Tue  Wed  Thu  Fri  Sat  Sun                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Agent Sessions                                             │
│  ─────────────────────────────────────────────────────────  │
│  │ Session                │ Tokens    │ Cost    │ Status   ││
│  ├────────────────────────┼───────────┼─────────┼──────────┤│
│  │ session-20251208-2108  │ 45,231    │ $0.89   │ done     ││
│  │ session-20251208-1934  │ 32,109    │ $0.64   │ done     ││
│  │ session-20251208-1822  │ 28,445    │ $0.57   │ paused   ││
│  └────────────────────────┴───────────┴─────────┴──────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
// KPI components
MetricCard         // Single metric with trend indicator
MetricGrid         // Grid of metric cards
TrendIndicator     // Up/down arrow with percentage

// Chart components
TaskCompletionChart  // Bar/line chart for task trends
ReworkTrendChart     // Line chart for rework rate
CostChart            // Area chart for cumulative cost
TokenUsageChart      // Bar chart for token usage

// Table components
SessionTable       // Recent sessions with metrics
ChainMetricsTable  // Per-chain metrics
```

### Chart Library

Use **Recharts** for React-native charting:
- Composable components
- Responsive by default
- Good TypeScript support
- Tailwind-friendly styling

---

## Acceptance Criteria

- [ ] `/metrics` page with KPI cards
- [ ] Time range selector (7d, 30d, 90d, all)
- [ ] Task completion count with trend
- [ ] Rework rate with trend
- [ ] Average cycle time with trend
- [ ] Total cost and token usage
- [ ] Task completion trend chart
- [ ] Recent sessions table with metrics
- [ ] Empty states when no data
- [ ] Loading skeletons while fetching
- [ ] Responsive layout
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Dependencies

- CR-20251208-002 (Web API Server)
- CR-20251208-003 (Dashboard Scaffold)
- CR-20251207-011 (Pipeline Metrics) - for metrics data

---

## Linked Design Documents

- [Web Dashboard](../../design/core/features/web-dashboard.md)
- [Pipeline Metrics](../../design/core/features/pipeline-metrics.md)

---

## Commits

[Populated by `choragen request:close`]
