# Task: Metric Card Components

**ID**: TASK-046-001  
**Chain**: CHAIN-046-metrics-dashboard  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create reusable metric card components for displaying KPIs with trend indicators.

---

## Deliverables

1. **MetricCard component** (`src/components/metrics/metric-card.tsx`)
   - Props: `title`, `value`, `description`, `icon`, `trend` (optional)
   - Display value prominently with optional trend indicator
   - Use Card from shadcn/ui

2. **TrendIndicator component** (`src/components/metrics/trend-indicator.tsx`)
   - Props: `value` (percentage), `direction` ('up' | 'down' | 'neutral')
   - Green up arrow for positive, red down arrow for negative
   - Show percentage change

3. **MetricCardSkeleton component** (`src/components/metrics/metric-card-skeleton.tsx`)
   - Loading state for MetricCard
   - Use Skeleton from shadcn/ui

4. **Index barrel** (`src/components/metrics/index.ts`)
   - Export all metric components

---

## Acceptance Criteria

- [ ] MetricCard displays title, value, description, and icon
- [ ] TrendIndicator shows directional arrow with percentage
- [ ] Skeleton loading state matches card dimensions
- [ ] Components follow existing patterns in `src/components/chains/`
- [ ] TypeScript types are properly defined

---

## Context

**Existing patterns**: See `src/components/chains/chain-card.tsx` for Card usage pattern.

**API data shape** (from `metrics.ts` router):
```typescript
interface TaskMetrics {
  completed: number;
  averageCycleTimeMs: number;
  // ...
}
interface ReworkMetrics {
  reworkRate: number;
  firstTimeRightRate: number;
  // ...
}
```

---

## Linked CR

- CR-20251208-006 (Metrics Dashboard)
