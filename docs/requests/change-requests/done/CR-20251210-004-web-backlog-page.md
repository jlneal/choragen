# Change Request: Promote Backlog to Top-Level Navigation

**ID**: CR-20251210-004  
**Domain**: dashboard  
**Status**: done  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Move Backlog from a sub-item under Requests to a top-level navigation item.

---

## Why

Backlog management is a frequent workflow. Top-level navigation provides:

- Faster access (one click vs two)
- Better visibility of backlog as a distinct concept
- Cleaner mental model (Requests = active work, Backlog = prioritized queue)

---

## Scope

**In Scope**:
- Move "Backlog" nav item to top-level in sidebar
- Create `/backlog` route (move or redirect from `/requests/backlog`)

**Chain**: Skipped — simple 2-file change, single session

**Out of Scope**:
- Backlog page functionality changes (already complete)
- New features

---

## Proposed Changes

### Navigation

Move "Backlog" to top-level between "Requests" and "Sessions":

```
├── Requests
├── Backlog      ← MOVED from Requests submenu
├── Sessions
```

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

- Move `/app/requests/backlog/page.tsx` to `/app/backlog/page.tsx`
- Update sidebar nav in `components/layout/sidebar.tsx`

---

## Completion Notes

- Created `/app/backlog/page.tsx` as top-level route
- Updated sidebar nav to place Backlog as standalone item after Requests
- Updated `BacklogCount` component link to `/backlog`
- Old `/requests/backlog` route left intact for backwards compatibility
