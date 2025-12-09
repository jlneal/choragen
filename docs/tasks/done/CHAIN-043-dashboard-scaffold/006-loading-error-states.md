# Task: Loading and Error States

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 006  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Implement loading skeletons and error boundary with fallback UI.

---

## Requirements

### Loading States

1. Create `src/components/loading-skeleton.tsx`:
   - Card skeleton
   - List skeleton
   - Table skeleton

2. Create route-level loading files:
   - `app/loading.tsx` (root loading)
   - `app/chains/loading.tsx`
   - `app/requests/loading.tsx`

### Error Boundary

1. Create `src/components/error-boundary.tsx`:
   - Catch React errors
   - Display user-friendly message
   - "Try again" button

2. Create `app/error.tsx`:
   - Next.js error boundary
   - Reset functionality

3. Create `app/not-found.tsx`:
   - 404 page
   - Link back to dashboard

---

## Acceptance Criteria

- [ ] Loading skeletons display during data fetching
- [ ] Error boundary catches and displays errors
- [ ] 404 page exists and is styled
- [ ] "Try again" resets error state
- [ ] Skeletons match actual content layout
- [ ] `pnpm build` passes

---

## Dependencies

- Task 001 (Skeleton component)
- Task 004 (root layout)
