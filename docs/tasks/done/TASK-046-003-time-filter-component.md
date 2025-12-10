# Task: Time Filter Component

**ID**: TASK-046-003  
**Chain**: CHAIN-046-metrics-dashboard  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create a time range filter component for filtering metrics by date range.

---

## Deliverables

1. **TimeRangeFilter component** (`src/components/metrics/time-range-filter.tsx`)
   - Toggle group with options: 7d, 30d, 90d, All
   - Props: `value`, `onChange`
   - Returns `since` Date or undefined (for "All")
   - Use shadcn/ui Button or ToggleGroup

2. **useTimeRange hook** (`src/hooks/use-time-range.ts`)
   - Manages selected time range state
   - Returns `{ range, since, setRange }`
   - Calculates `since` Date from range selection

---

## Acceptance Criteria

- [ ] TimeRangeFilter displays 4 options: 7d, 30d, 90d, All
- [ ] Selected option is visually highlighted
- [ ] Hook calculates correct `since` Date for each range
- [ ] "All" returns undefined for `since`
- [ ] Component is accessible (keyboard navigation)

---

## Context

**Time range calculation**:
```typescript
type TimeRange = '7d' | '30d' | '90d' | 'all';

function getSinceDate(range: TimeRange): Date | undefined {
  if (range === 'all') return undefined;
  const days = parseInt(range);
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}
```

**API usage**: The `since` value is passed to tRPC queries:
```typescript
trpc.metrics.getSummary.useQuery({ since })
```

---

## Linked CR

- CR-20251208-006 (Metrics Dashboard)
