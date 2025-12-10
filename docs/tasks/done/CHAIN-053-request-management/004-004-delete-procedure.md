# Task: Add requests.delete tRPC procedure

**Chain**: CHAIN-053-request-management  
**Task**: 004-004-delete-procedure  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add a `requests.delete` tRPC procedure to remove a request file from the system.

The procedure should:
1. Accept request ID
2. Find and delete the request file
3. Return confirmation

---

## Expected Files

- `packages/web/src/server/routers/requests.ts` (modify)

---

## Acceptance Criteria

- [ ] `requests.delete` procedure accepts `{ requestId }`
- [ ] Finds request file across all status directories
- [ ] Deletes the file using `fs.unlink()`
- [ ] Returns `{ success: true, deletedId }` on success
- [ ] Throws NOT_FOUND if request doesn't exist
- [ ] Consider: Should we prevent deleting requests with linked chains?

---

## Notes

Deletion is destructive. Consider adding a confirmation step in the UI (task 006) or soft-delete (move to archive) in future.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
