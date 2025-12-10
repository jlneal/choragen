# Change Request: Tag-to-Group Conversion

**ID**: CR-20251209-027  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add the ability to convert a tag into a group, with collision handling for requests already in groups.

---

## Why

Tags and groups serve different purposes:
- **Tags**: Flexible categorization (many-to-many)
- **Groups**: Collective management (one-to-one)

Converting a tag to a group enables:
- Quick group creation from existing categorization
- Batch prioritization of tagged items
- Natural workflow from tagging to grouping

---

## Scope

**In Scope**:
- "Create group from tag" action
- Collision detection (requests already in groups)
- Collision resolution UI:
  - Re-rank all collisions into new group
  - Leave collisions in existing groups
  - Individual selection menu
- Tag preserved after conversion (group membership is separate)

**Out of Scope**:
- Automatic tag-to-group sync
- Group-to-tag conversion
- Bulk tag operations

---

## Proposed Changes

### Workflow

1. User selects "Create group from tag: `dashboard`"
2. System finds all requests with tag `dashboard`
3. System checks for collisions (requests already in groups)
4. If collisions exist, show resolution dialog
5. Create group with resolved membership
6. Tag remains on requests (not removed)

### Collision Resolution Dialog

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

### tRPC Procedures

```typescript
groups.createFromTag({ 
  tag: string,
  collisionStrategy: 'move-all' | 'keep-existing' | 'manual',
  manualSelections?: { requestId: string, moveToNew: boolean }[]
})

groups.previewFromTag({ tag })  // Returns requests and collision info
```

### UI Components

- **TagContextMenu**: "Create group from tag" option
- **CollisionDialog**: Resolution UI shown above
- **CollisionPreview**: Shows which requests would be affected

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Dependencies

- CR-20251209-023 (Request Tagging)
- CR-20251209-025 (Request Groups)

---

## Commits

No commits yet.

---

## Implementation Notes

The tag is not removed from requests when creating a group. Tags and groups are independent — a request can have tags AND be in a group.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
