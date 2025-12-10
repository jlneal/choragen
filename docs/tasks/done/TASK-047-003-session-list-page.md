# Task: Session List Page

**ID**: TASK-047-003  
**Chain**: CHAIN-047-agent-session-monitor  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Implement the `/sessions` page with session list, filtering, and sorting.

---

## Deliverables

1. **SessionList component** (`src/components/sessions/session-list.tsx`)
   - Fetch sessions using tRPC `sessions.list`
   - Display SessionCard for each session
   - Show loading skeletons while fetching
   - Show empty state when no sessions

2. **Update sessions page** (`src/app/sessions/page.tsx`)
   - Replace placeholder with SessionList
   - Add SessionFilters and SessionSort
   - Page header with title and description

3. **Empty state component** (`src/components/sessions/session-empty.tsx`)
   - Display when no sessions match filters
   - Helpful message about starting sessions

---

## Acceptance Criteria

- [x] `/sessions` page lists all active sessions
- [x] Session cards show: chainId, agent, files, timestamps
- [x] Status badges with correct colors
- [x] Filter by status works
- [x] Sort by date works
- [x] Empty state displays when no sessions
- [x] Loading skeletons while fetching

---

## Context

**Existing patterns**: See `src/components/requests/request-list.tsx` for list implementation.

**tRPC query**:
```typescript
const { data: sessions, isLoading } = trpc.sessions.list.useQuery();
```

---

## Linked CR

- CR-20251208-007 (Agent Session Monitor)
