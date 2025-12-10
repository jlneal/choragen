# Task: Session Components

**ID**: TASK-047-001  
**Chain**: CHAIN-047-agent-session-monitor  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create reusable session components for displaying agent session information.

---

## Deliverables

1. **SessionStatusBadge component** (`src/components/sessions/session-status-badge.tsx`)
   - Props: `status` ('running' | 'paused' | 'completed' | 'failed')
   - Colors: green=running, yellow=paused, gray=completed, red=failed
   - Use Badge from shadcn/ui

2. **SessionCard component** (`src/components/sessions/session-card.tsx`)
   - Props: `session` (Session type from router)
   - Display: chainId, agent role, files count, started time, expires time
   - Include SessionStatusBadge
   - Link to session detail page
   - Use Card from shadcn/ui

3. **SessionCardSkeleton component** (`src/components/sessions/session-card-skeleton.tsx`)
   - Loading state for SessionCard
   - Use Skeleton from shadcn/ui

4. **Index barrel** (`src/components/sessions/index.ts`)
   - Export all session components

---

## Acceptance Criteria

- [ ] SessionStatusBadge displays correct colors for each status
- [ ] SessionCard shows chainId, agent, files, timestamps
- [ ] Cards are clickable and link to `/sessions/[chainId]`
- [ ] Skeleton loading state matches card dimensions
- [ ] Components follow existing patterns in `src/components/requests/`
- [ ] TypeScript types are properly defined

---

## Context

**Existing patterns**: See `src/components/requests/request-card.tsx` and `src/components/requests/request-status-badge.tsx`.

**API data shape** (from `sessions.ts` router):
```typescript
interface Session {
  chainId: string;
  agent: string;
  startedAt: Date;
  files: string[];
  expiresAt?: Date;
}
```

**Note**: The current router derives sessions from file locks. Status can be inferred:
- `running`: lock exists and not expired
- `failed`: lock expired (expiresAt < now)
- Future: `paused`, `completed` will come from enhanced session tracking

---

## Linked CR

- CR-20251208-007 (Agent Session Monitor)
