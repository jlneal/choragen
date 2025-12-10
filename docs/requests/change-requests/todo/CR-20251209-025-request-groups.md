# Change Request: Request Groups

**ID**: CR-20251209-025  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add the ability to group related requests together for collective management.

---

## Why

Related requests often need to be:
- Moved together in priority
- Viewed as a unit
- Tracked as a feature set
- Assigned to the same milestone

Groups provide a lightweight way to manage request collections without formal project/epic structures.

---

## Scope

**In Scope**:
- Create named groups
- Add/remove requests from groups
- View group contents
- Move group as a unit (redistributes ranks)
- Remove request from group (long-press/long-click)
- Project-scoped groups

**Out of Scope**:
- Nested groups
- Cross-project groups
- Group templates
- Group-level metadata (owner, deadline)

---

## Proposed Changes

### Data Model

Groups stored in `.choragen/groups.json`:

```json
{
  "groups": [
    {
      "id": "grp-001",
      "name": "Dashboard Phase 2",
      "requestIds": ["CR-20251209-018", "CR-20251209-019", "CR-20251209-020"]
    }
  ]
}
```

### tRPC Procedures

```typescript
groups.create({ name })
groups.delete({ groupId })
groups.rename({ groupId, name })
groups.addRequest({ groupId, requestId })
groups.removeRequest({ groupId, requestId })
groups.move({ groupId, delta })  // Move group by delta positions
groups.list()
```

### UI Components

- **GroupCard**: Collapsible group showing member requests
- **GroupHeader**: Group name with expand/collapse, move controls
- **GroupActions**: Create group, add to group context menu
- **RequestGroupBadge**: Shows group membership on request card

### Interaction

- **Long-press on request in group**: Shows "Remove from group" option
- **Drag group header**: Moves entire group (redistributes member ranks)

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

A request can only belong to one group at a time. Adding to a new group removes from the old group.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
