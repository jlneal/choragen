# Task: Metrics Page Implementation

**ID**: TASK-046-004  
**Chain**: CHAIN-046-metrics-dashboard  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Implement the full metrics page with KPI grid, charts, and data fetching.

---

## Deliverables

1. **Update metrics page** (`src/app/metrics/page.tsx`)
   - Convert to client component ("use client")
   - Add TimeRangeFilter at top
   - KPI grid with 6 MetricCards:
     - Tasks Completed (with trend)
     - Rework Rate (with trend)
     - Avg Cycle Time (with trend)
     - Chains Completed
     - Total Cost (placeholder)
     - Tokens Used (placeholder)
   - TaskCompletionChart below KPI grid
   - ReworkTrendChart below task chart

2. **useMetrics hook** (`src/hooks/use-metrics.ts`)
   - Fetches metrics summary via tRPC
   - Accepts `since` parameter
   - Returns `{ data, isLoading, error }`

3. **Data transformation utilities** (`src/lib/metrics-utils.ts`)
   - `formatCycleTime(ms: number)` - converts ms to human-readable
   - `formatPercentage(rate: number)` - formats as percentage
   - `formatNumber(n: number)` - formats large numbers (e.g., 2.1M)
   - `calculateTrend(current: number, previous: number)` - returns trend %

---

## Acceptance Criteria

- [ ] Page fetches data via tRPC `metrics.getSummary`
- [ ] Time filter changes refetch data with new `since`
- [ ] KPI cards show real data from API
- [ ] Charts display trend data
- [ ] Loading skeletons shown while fetching
- [ ] Empty states when no data available
- [ ] Responsive grid layout (3 cols on desktop, 1 on mobile)

---

## Context

**tRPC queries available**:
- `metrics.getSummary` - combined metrics
- `metrics.getEvents` - raw events for chart data
- `metrics.getTaskMetrics` - task-specific metrics
- `metrics.getReworkMetrics` - rework-specific metrics

**Depends on**: TASK-046-001, TASK-046-002, TASK-046-003

---

## Linked CR

- CR-20251208-006 (Metrics Dashboard)
