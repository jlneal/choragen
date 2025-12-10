# Task: Chart Components

**ID**: TASK-046-002  
**Chain**: CHAIN-046-metrics-dashboard  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create chart components using Recharts for visualizing metrics trends.

---

## Deliverables

1. **TaskCompletionChart component** (`src/components/metrics/task-completion-chart.tsx`)
   - Bar chart showing tasks completed over time
   - Props: `data` (array of { date, count })
   - Responsive container
   - Tailwind-friendly colors using CSS variables

2. **ReworkTrendChart component** (`src/components/metrics/rework-trend-chart.tsx`)
   - Line chart showing rework rate over time
   - Props: `data` (array of { date, rate })
   - Show percentage on Y-axis

3. **ChartContainer component** (`src/components/metrics/chart-container.tsx`)
   - Wrapper with Card, title, and description
   - Props: `title`, `description`, `children`
   - Handles empty state when no data

4. **ChartSkeleton component** (`src/components/metrics/chart-skeleton.tsx`)
   - Loading state for charts
   - Placeholder bars/lines

---

## Acceptance Criteria

- [ ] TaskCompletionChart renders bar chart with Recharts
- [ ] ReworkTrendChart renders line chart with Recharts
- [ ] Charts are responsive (use ResponsiveContainer)
- [ ] Empty state shown when data array is empty
- [ ] Loading skeleton matches chart dimensions
- [ ] Colors use Tailwind CSS variables for theming

---

## Context

**Recharts usage**:
```typescript
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="date" />
    <YAxis />
    <Bar dataKey="count" fill="hsl(var(--primary))" />
  </BarChart>
</ResponsiveContainer>
```

**Depends on**: TASK-046-001 (for shared patterns)

---

## Linked CR

- CR-20251208-006 (Metrics Dashboard)
