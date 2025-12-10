# Task: Session Filters and Sorting

**ID**: TASK-047-002  
**Chain**: CHAIN-047-agent-session-monitor  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create filter and sort components for the session list page.

---

## Deliverables

1. **SessionFilters component** (`src/components/sessions/session-filters.tsx`)
   - Status filter: All, Running, Paused, Completed, Failed
   - Agent role filter: All, impl, control
   - Use existing filter patterns from requests

2. **SessionSort component** (`src/components/sessions/session-sort.tsx`)
   - Sort options: Date (newest/oldest), Files count
   - Use existing sort patterns from requests

3. **useSessionFilters hook** (`src/hooks/use-session-filters.ts`)
   - Manage filter and sort state
   - URL query param sync (optional)
   - Return filtered/sorted sessions

---

## Acceptance Criteria

- [ ] Status filter shows all status options
- [ ] Agent role filter works correctly
- [ ] Sort by date and files count
- [ ] Filters update session list in real-time
- [ ] Follow existing patterns in `src/components/requests/request-filters.tsx`

---

## Context

**Existing patterns**: See `src/components/requests/request-filters.tsx` and `src/components/requests/request-sort.tsx`.

---

## Linked CR

- CR-20251208-007 (Agent Session Monitor)
