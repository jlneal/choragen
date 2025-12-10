# Change Request: Request Backlog

**ID**: CR-20251209-024  
**Domain**: core  
**Status**: done  
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

See git log for CHAIN-049.

---

## Implementation Notes

When promoting from backlog to todo, the request is appended to the end of the todo queue (FIFO). Backlog rank does not carry over to todo.

---

## Completion Notes

Implemented request backlog feature for the web dashboard:

**T001 — Backlog Infrastructure**:
- Created `docs/requests/change-requests/backlog/` and `docs/requests/fix-requests/backlog/`
- Added `backlog` to RequestStatus type and status enum
- Updated requests router to scan backlog directory
- Added backlog filter option and status badge styling (slate)

**T002 — Promote/Demote Operations**:
- `requests.promote({ requestId })` — moves backlog → todo
- `requests.demote({ requestId })` — moves todo → backlog
- Both validate request is in correct state before moving
- 10 unit tests covering success and error cases

**T003 — Backlog UI**:
- Created `/requests/backlog` page
- Added BacklogList and BacklogCount components
- Added promote button to backlog request cards
- Added demote button to todo request cards
- Updated sidebar with backlog link under Requests
- Added backlog count display in requests page header

**Verification**:
- Typecheck: ✅ Pass
- Lint: ✅ Pass
- Tests: ✅ 65 passing
- Build: ✅ Pass

**Chain**: CHAIN-049-request-backlog
**Completed**: 2025-12-09
