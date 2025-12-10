# Task: Implement Request Backlog

**Chain**: CHAIN-049  
**Task**: T001  
**Type**: impl  
**Status**: todo  
**Request**: CR-20251209-024  

---

## Objective

Add a `backlog/` state for requests, representing uncommitted work that precedes `todo/`.

---

## Acceptance Criteria

1. **Directory structure**: Create `backlog/` directories for CR and FR
2. **Request lifecycle**: Support `backlog/ → todo/ → doing/ → done/` flow
3. **tRPC procedures**: Implement `requests.promote` and `requests.demote`
4. **Backlog view**: New UI view showing backlog requests
5. **Dashboard count**: Show backlog count in dashboard metrics
6. **Tests**: Unit tests for promote/demote operations

---

## Implementation Guide

### 1. Create Backlog Directories

```
docs/requests/
├── change-requests/
│   ├── backlog/     # NEW
│   ├── todo/
│   ├── doing/
│   └── done/
└── fix-requests/
    ├── backlog/     # NEW
    ├── todo/
    ├── doing/
    └── done/
```

### 2. Update Request Status Enum

In request parsing, add `backlog` as a valid status.

### 3. Add tRPC Procedures

In `packages/web/src/server/routers/requests.ts`:

```typescript
requests.promote({ requestId })  // Move backlog → todo (append to end)
requests.demote({ requestId })   // Move todo → backlog
```

### 4. Update Request Listing

- Include backlog requests in queries
- Add status filter for backlog
- Show backlog count in metrics

### 5. UI Components

- Add BacklogView page at `/requests/backlog`
- Add promote/demote buttons to request cards
- Update navigation to include backlog link

---

## Files to Modify

- `packages/web/src/server/routers/requests.ts` - Add promote/demote, update listing
- `packages/web/src/app/requests/page.tsx` - Add backlog filter option
- `packages/web/src/components/requests/request-card.tsx` - Add promote/demote actions

## Files to Create

- `docs/requests/change-requests/backlog/.gitkeep`
- `docs/requests/fix-requests/backlog/.gitkeep`
- `packages/web/src/app/requests/backlog/page.tsx`
- `packages/web/src/__tests__/backlog.test.ts`

---

## Notes

When promoting from backlog to todo, the request is appended to the end of the todo queue (FIFO). Backlog rank does not carry over to todo.
