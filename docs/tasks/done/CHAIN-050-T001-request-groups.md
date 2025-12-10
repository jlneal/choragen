# Task: Implement Request Groups

**Chain**: CHAIN-050  
**Task**: T001  
**Type**: impl  
**Status**: done  
**Request**: CR-20251209-025  

---

## Objective

Add the ability to group related requests together for collective management.

---

## Acceptance Criteria

1. **Data model**: Groups stored in `.choragen/groups.json`
2. **tRPC procedures**: Implement group CRUD and membership operations
3. **UI components**: GroupCard, GroupHeader, GroupActions, RequestGroupBadge
4. **Group movement**: Moving a group redistributes member ranks
5. **Remove from group**: Long-press/long-click to remove request from group
6. **Tests**: Unit tests for group operations

---

## Implementation Guide

### 1. Data Model

Create `.choragen/groups.json`:

```json
{
  "groups": [
    {
      "id": "grp-001",
      "name": "Dashboard Phase 2",
      "requestIds": ["CR-20251209-018", "CR-20251209-019"]
    }
  ]
}
```

### 2. Add tRPC Procedures

Create `packages/web/src/server/routers/groups.ts`:

```typescript
groups.create({ name })
groups.delete({ groupId })
groups.rename({ groupId, name })
groups.addRequest({ groupId, requestId })
groups.removeRequest({ groupId, requestId })
groups.move({ groupId, delta })  // Move group by delta positions
groups.list()
```

### 3. UI Components

- `packages/web/src/components/groups/group-card.tsx` - Collapsible group
- `packages/web/src/components/groups/group-header.tsx` - Name, expand/collapse
- `packages/web/src/components/groups/group-actions.tsx` - Create, add to group
- `packages/web/src/components/groups/request-group-badge.tsx` - Shows membership

### 4. Interactions

- Long-press on request in group → "Remove from group" option
- Drag group header → Moves entire group

---

## Files to Modify

- `packages/web/src/server/routers/index.ts` - Add groups router
- `packages/web/src/components/requests/request-card.tsx` - Show group badge

## Files to Create

- `.choragen/groups.json` - Initial empty groups file
- `packages/web/src/server/routers/groups.ts` - Groups router
- `packages/web/src/components/groups/group-card.tsx`
- `packages/web/src/components/groups/group-header.tsx`
- `packages/web/src/components/groups/group-actions.tsx`
- `packages/web/src/components/groups/request-group-badge.tsx`
- `packages/web/src/__tests__/groups.test.ts`

---

## Notes

A request can only belong to one group at a time. Adding to a new group removes from the old group.
