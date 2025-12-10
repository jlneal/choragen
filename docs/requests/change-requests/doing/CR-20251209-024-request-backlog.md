# Change Request: Request Backlog

**ID**: CR-20251209-024  
**Domain**: core  
**Status**: doing  
**Chain**: CHAIN-049  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add a `backlog/` state for requests, representing uncommitted work that precedes `todo/`.

---

## Why

Currently `todo/` conflates two concepts:
- Ideas and future work (uncommitted)
- Work ready to start (committed)

A separate backlog enables:
- Clear distinction between "maybe" and "definitely"
- Prioritization of uncommitted work
- Explicit promotion workflow (backlog → todo)
- Better capacity planning

---

## Scope

**In Scope**:
- New `backlog/` directory for CR and FR
- Promote request from backlog to todo
- Demote request from todo to backlog
- Backlog view in web UI
- Backlog count in dashboard

**Out of Scope**:
- Automatic promotion rules
- Backlog limits/WIP limits
- Time-based backlog grooming

---

## Proposed Changes

### Directory Structure

```
docs/requests/
├── change-requests/
│   ├── backlog/     # NEW: Uncommitted ideas
│   ├── todo/        # Committed, ready to work
│   ├── doing/       # In progress
│   └── done/        # Complete
└── fix-requests/
    ├── backlog/     # NEW
    ├── todo/
    ├── doing/
    └── done/
```

### Request Lifecycle

```
backlog/ → todo/ → doing/ → done/
   ↑         │
   └─────────┘  (demote)
```

### tRPC Procedures

```typescript
requests.promote({ requestId })  // backlog → todo (appends to end)
requests.demote({ requestId })   // todo → backlog
```

### UI Components

- **BacklogView**: List of backlog requests with promote action
- **RequestStateIndicator**: Visual distinction for backlog vs todo

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

When promoting from backlog to todo, the request is appended to the end of the todo queue (FIFO). Backlog rank does not carry over to todo.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
