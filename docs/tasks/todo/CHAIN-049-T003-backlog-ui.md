# Task: Backlog UI

**Chain**: CHAIN-049  
**Task**: T003  
**Type**: impl  
**Status**: todo  
**Request**: CR-20251209-024  

---

## Objective

Add UI components for viewing and managing backlog requests.

---

## Acceptance Criteria

1. Create `/requests/backlog` page showing only backlog requests
2. Add promote button to backlog request cards
3. Add demote button to todo request cards
4. Update navigation to include backlog link
5. Show backlog count in dashboard or requests page header

---

## Implementation Guide

### 1. Backlog Page

Create `packages/web/src/app/requests/backlog/page.tsx`:

- Reuse `RequestList` component with status filter preset to `backlog`
- Or create dedicated `BacklogList` if different layout needed

### 2. Request Card Actions

In `packages/web/src/components/requests/request-card.tsx`:

- Add "Promote to Todo" button for backlog requests
- Add "Move to Backlog" button for todo requests
- Wire buttons to `trpc.requests.promote` / `trpc.requests.demote`
- Invalidate queries on success

### 3. Navigation Update

In sidebar/navigation component:

- Add "Backlog" link under Requests section
- Show count badge if backlog has items

### 4. Backlog Count

Display backlog count somewhere visible:
- In requests page header: "Backlog (5) | Todo (3) | Doing (1)"
- Or in dashboard metrics card

---

## Files to Modify

- `packages/web/src/components/requests/request-card.tsx` — Add action buttons
- `packages/web/src/components/sidebar.tsx` (or nav component) — Add backlog link
- `packages/web/src/app/requests/page.tsx` — Add backlog count display

## Files to Create

- `packages/web/src/app/requests/backlog/page.tsx`

---

## Notes

Depends on T001 (infrastructure) and T002 (promote/demote operations).
