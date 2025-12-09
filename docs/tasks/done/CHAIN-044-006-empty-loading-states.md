# Task: Empty & Loading States

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 006-empty-loading-states  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Implement polished empty states and loading skeletons for chain/task views.

---

## Description

Create consistent empty and loading states:

1. **Empty states**:
   - No chains exist: Prompt to create first chain
   - No chains match filter: Clear filters suggestion
   - No tasks in chain: Chain has no tasks message

2. **Loading skeletons**:
   - ChainCardSkeleton: Matches ChainCard layout
   - TaskRowSkeleton: Matches TaskRow layout
   - ChainHeaderSkeleton: Matches ChainHeader layout

3. **Integration**:
   - Update ChainList to use skeletons
   - Update TaskList to use skeletons
   - Update chain detail page loading.tsx

---

## Expected Files

- `packages/web/src/components/chains/chain-card-skeleton.tsx`
- `packages/web/src/components/chains/chain-empty-state.tsx`
- `packages/web/src/components/tasks/task-row-skeleton.tsx`
- `packages/web/src/components/tasks/task-empty-state.tsx`
- `packages/web/src/app/chains/[id]/loading.tsx` (update)

---

## Acceptance Criteria

- [ ] Empty states for no chains/tasks
- [ ] Loading skeletons while fetching
- [ ] Skeletons match actual component layouts
- [ ] Empty states have helpful messaging
- [ ] Consistent styling with rest of app

---

## Constraints

- Use existing Skeleton component from `@/components/ui/skeleton`
- Follow existing loading-skeleton.tsx patterns
- ADR reference: ADR-011-web-api-architecture

---

## Notes

Reference `packages/web/src/components/loading-skeleton.tsx` for patterns.
