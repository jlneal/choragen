# Task: Implement Tag-to-Group Conversion

**Chain**: CHAIN-052  
**Task**: T001  
**Type**: impl  
**Status**: done  
**Request**: CR-20251209-027  

---

## Objective

Add the ability to convert a tag into a group, with collision handling for requests already in groups.

---

## Acceptance Criteria

1. **Create group from tag**: Action in tag context menu
2. **Collision detection**: Identify requests already in groups
3. **Collision resolution UI**: Three options - move all, keep existing, choose individually
4. **Tag preserved**: Tag remains after conversion (independent of group)
5. **tRPC procedures**: `groups.createFromTag`, `groups.previewFromTag`
6. **Tests**: Unit tests for collision handling

---

## Implementation Guide

### 1. Workflow

1. User selects "Create group from tag: `dashboard`"
2. System finds all requests with tag `dashboard`
3. System checks for collisions (requests already in groups)
4. If collisions exist, show resolution dialog
5. Create group with resolved membership
6. Tag remains on requests (not removed)

### 2. tRPC Procedures

Add to `packages/web/src/server/routers/groups.ts`:

```typescript
groups.createFromTag({ 
  tag: string,
  collisionStrategy: 'move-all' | 'keep-existing' | 'manual',
  manualSelections?: { requestId: string, moveToNew: boolean }[]
})

groups.previewFromTag({ tag })  // Returns requests and collision info
```

### 3. UI Components

- `packages/web/src/components/tags/tag-context-menu.tsx` - Add "Create group from tag"
- `packages/web/src/components/groups/collision-dialog.tsx` - Resolution UI
- `packages/web/src/components/groups/collision-preview.tsx` - Shows affected requests

### 4. Collision Dialog

```
┌─────────────────────────────────────────────────┐
│ Create Group from Tag: "dashboard"              │
├─────────────────────────────────────────────────┤
│ 5 requests have this tag                        │
│ 2 are already in other groups:                  │
│                                                 │
│ ☐ CR-019 (in "Phase 1")                        │
│ ☐ CR-021 (in "Core Features")                  │
│                                                 │
│ What would you like to do?                      │
│                                                 │
│ [Move all to new group]                         │
│ [Keep in existing groups]                       │
│ [Choose individually ▼]                         │
└─────────────────────────────────────────────────┘
```

---

## Files to Modify

- `packages/web/src/server/routers/groups.ts` - Add createFromTag, previewFromTag
- `packages/web/src/components/tags/tag-badge.tsx` - Add context menu

## Files to Create

- `packages/web/src/components/tags/tag-context-menu.tsx`
- `packages/web/src/components/groups/collision-dialog.tsx`
- `packages/web/src/components/groups/collision-preview.tsx`
- `packages/web/src/__tests__/tag-to-group.test.ts`

---

## Notes

The tag is not removed from requests when creating a group. Tags and groups are independent — a request can have tags AND be in a group.
