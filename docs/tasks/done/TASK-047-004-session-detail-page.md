# Task: Session Detail Page

**ID**: TASK-047-004  
**Chain**: CHAIN-047-agent-session-monitor  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Implement the `/sessions/[id]` detail page with full session information.

---

## Deliverables

1. **Session detail page** (`src/app/sessions/[id]/page.tsx`)
   - Fetch session using tRPC `sessions.get`
   - Display SessionHeader, SessionMetrics, SessionContext
   - Handle not found state
   - Back navigation to sessions list

2. **SessionHeader component** (`src/components/sessions/session-header.tsx`)
   - Display chainId, status badge
   - Started/expires timestamps
   - Back button

3. **SessionMetrics component** (`src/components/sessions/session-metrics.tsx`)
   - Display agent role, files count, duration
   - Use MetricCard-style display
   - Grid layout for metrics

4. **SessionContext component** (`src/components/sessions/session-context.tsx`)
   - Show chain link (if chainId maps to a chain)
   - Display locked files list
   - Link to chain detail page

5. **SessionError component** (`src/components/sessions/session-error.tsx`)
   - Display error details for failed/expired sessions
   - Show expiration info if applicable

---

## Acceptance Criteria

- [x] `/sessions/[id]` shows session detail
- [x] Display session metrics (agent, files, duration)
- [x] Show chain context with link
- [x] Display locked files list
- [x] Show error details for expired sessions
- [x] Back navigation works
- [x] Loading state while fetching
- [x] 404 handling for non-existent sessions

---

## Context

**Existing patterns**: See `src/app/chains/[id]/page.tsx` for detail page pattern.

**tRPC query**:
```typescript
const { data: session, isLoading, error } = trpc.sessions.get.useQuery(id);
```

---

## Linked CR

- CR-20251208-007 (Agent Session Monitor)
