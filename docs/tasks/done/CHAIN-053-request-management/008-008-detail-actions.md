# Task: Integrate actions into request detail page

**Chain**: CHAIN-053-request-management  
**Task**: 008-008-detail-actions  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Integrate the RequestActions dropdown into the request detail page (`/requests/[id]`) header.

---

## Expected Files

- `packages/web/src/app/requests/[id]/page.tsx` (modify)
- `packages/web/src/components/requests/request-header.tsx` (modify if exists, or create)

---

## Acceptance Criteria

- [ ] RequestActions dropdown appears in request detail page header
- [ ] Actions work correctly from detail page context
- [ ] After status change, page data refreshes
- [ ] After delete, redirects to `/requests`
- [ ] Edit action either opens inline editor or navigates to edit page

---

## Notes

Depends on task 006 (RequestActions component). Check if `/requests/[id]/page.tsx` exists; if not, this task may need to create the detail page structure first.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
