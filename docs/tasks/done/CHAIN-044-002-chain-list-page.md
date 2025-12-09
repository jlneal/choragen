# Task: Chain List Page

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 002-chain-list-page  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Implement the `/chains` page with filtering, sorting, and chain list display.

---

## Description

Replace the placeholder chains page with a fully functional list view:

1. **ChainFilters** component:
   - Filter by status (todo, in-progress, done)
   - Filter by type (design, implementation)
   - Clear filters button

2. **ChainSort** component:
   - Sort by date (newest/oldest)
   - Sort by progress (highest/lowest)
   - Sort by name (A-Z/Z-A)

3. **ChainList** component:
   - Renders list of ChainCard components
   - Handles empty state
   - Loading skeleton while fetching

4. **Page integration**:
   - Wire up tRPC `chains.list` query
   - Client-side filtering/sorting
   - URL state for filters (optional)

---

## Expected Files

- `packages/web/src/components/chains/chain-filters.tsx`
- `packages/web/src/components/chains/chain-sort.tsx`
- `packages/web/src/components/chains/chain-list.tsx`
- `packages/web/src/app/chains/page.tsx` (update)

---

## Acceptance Criteria

- [ ] `/chains` page lists all chains
- [ ] Filter chains by status (todo, in-progress, done)
- [ ] Filter chains by type (design, implementation)
- [ ] Sort chains by date, progress, name
- [ ] Empty state displayed when no chains match filters
- [ ] Loading skeletons while fetching

---

## Constraints

- Use tRPC client for data fetching
- Client component with `"use client"` directive
- ADR reference: ADR-011-web-api-architecture

---

## Notes

Depends on task 001 for ChainCard component.
