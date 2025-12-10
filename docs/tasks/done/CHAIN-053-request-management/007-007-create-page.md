# Task: Add create request page at /requests/new

**Chain**: CHAIN-053-request-management  
**Task**: 007-007-create-page  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a new page at `/requests/new` for creating new requests, and add a "New Request" button to the requests list page.

---

## Expected Files

- `packages/web/src/app/requests/new/page.tsx` (create)
- `packages/web/src/app/requests/page.tsx` (modify - add button)

---

## Acceptance Criteria

- [ ] `/requests/new` page exists and renders RequestForm
- [ ] Page has breadcrumb: Requests > New Request
- [ ] Page title: "Create Request"
- [ ] "New Request" button added to `/requests` page header
- [ ] Button links to `/requests/new`
- [ ] After successful creation, redirects to `/requests/{id}`
- [ ] Cancel button returns to `/requests`

---

## Notes

Depends on task 005 (RequestForm component). Follow existing page patterns in `packages/web/src/app/`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
