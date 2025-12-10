# Change Request: Web Backlog Page

**ID**: CR-20251210-004  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Add a dedicated backlog management page to the web dashboard for viewing and prioritizing the request backlog.

---

## Why

The backlog is currently accessible only as a sub-view under Requests. A dedicated page enables:

- Full-screen backlog view with drag-and-drop reordering
- Better visibility of backlog priorities
- Quick access from main navigation
- Streamlined workflow for backlog grooming sessions

---

## Scope

**In Scope**:
- New `/backlog` route in main navigation
- Full backlog list with drag-and-drop reordering
- Request summary cards (ID, title, domain, status)
- Persist reorder to `backlog-ranks.json`
- Filter by domain/type (CR vs FR)
- Link to request detail on click

**Out of Scope**:
- Sprint/iteration planning
- Effort estimation
- Backlog import/export
- Multiple backlog views

---

## Proposed Changes

### Navigation

Add "Backlog" to sidebar navigation between "Requests" and "Sessions":

```
├── Requests
├── Backlog      ← NEW
├── Sessions
```

### UI Components

```
┌─────────────────────────────────────────────────┐
│ Backlog                    [Filter ▼] [+ New]   │
├─────────────────────────────────────────────────┤
│ ≡ 1. CR-20251210-001 - Web Request Creation     │
│     dashboard • todo                            │
│ ≡ 2. CR-20251210-002 - Web Chain Creation       │
│     dashboard • todo                            │
│ ≡ 3. CR-20251210-003 - Web Task Creation        │
│     dashboard • todo                            │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

### Features

- Drag handle (≡) for reordering
- Rank number display
- Domain badge
- Status indicator
- Click to navigate to request detail

---

## Affected Design Documents

- `docs/design/core/enhancements/dashboard-ui.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

Reuse existing `backlog` tRPC router. Consider using `@dnd-kit` or similar for drag-and-drop. The existing `/requests/backlog` sub-route can redirect to the new page or be removed.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
