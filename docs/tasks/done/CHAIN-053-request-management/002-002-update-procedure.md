# Task: Add requests.update tRPC procedure

**Chain**: CHAIN-053-request-management  
**Task**: 002-002-update-procedure  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add a `requests.update` tRPC procedure to edit existing request content (title, description, scope sections).

The procedure should:
1. Accept request ID and partial updates
2. Parse existing file, apply updates, write back
3. Preserve sections not being updated
4. Return updated metadata

---

## Expected Files

- `packages/web/src/server/routers/requests.ts` (modify)

---

## Acceptance Criteria

- [ ] `requests.update` procedure accepts `{ requestId, updates: { title?, domain?, description?, scope? } }`
- [ ] Updates only the specified fields in the markdown file
- [ ] Preserves all other content (commits, notes, etc.)
- [ ] Returns updated request metadata
- [ ] Throws NOT_FOUND if request doesn't exist

---

## Notes

Use regex replacement similar to existing `updateStatus` for updating metadata fields. For body sections (description, scope), may need more sophisticated parsing.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
