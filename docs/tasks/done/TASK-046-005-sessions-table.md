# Task: Sessions Table

**ID**: TASK-046-005  
**Chain**: CHAIN-046-metrics-dashboard  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create a table component showing recent agent sessions with token usage and cost metrics.

---

## Deliverables

1. **SessionsTable component** (`src/components/metrics/sessions-table.tsx`)
   - Table showing recent sessions
   - Columns: Session ID, Tokens, Cost, Status, Date
   - Props: `sessions` array
   - Use shadcn/ui Table components

2. **SessionsTableSkeleton** (`src/components/metrics/sessions-table-skeleton.tsx`)
   - Loading state with skeleton rows

3. **Add to metrics page**
   - Add SessionsTable below charts
   - Fetch session data (may need to derive from events)

---

## Acceptance Criteria

- [ ] Table displays session data with all columns
- [ ] Sessions sorted by date (most recent first)
- [ ] Status shown with appropriate badge
- [ ] Loading skeleton shown while fetching
- [ ] Empty state when no sessions
- [ ] Responsive (horizontal scroll on mobile)

---

## Context

**Note**: Session data may need to be derived from pipeline events. The current API returns events, not sessions directly. Consider:
- Grouping events by session ID
- Aggregating token counts per session
- Calculating cost from token usage

**Depends on**: TASK-046-004

---

## Linked CR

- CR-20251208-006 (Metrics Dashboard)
