# Task: Add requests.close tRPC procedure

**Chain**: CHAIN-053-request-management  
**Task**: 003-003-close-procedure  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add a `requests.close` tRPC procedure to close a request with completion notes and move it to `done/`.

The procedure should:
1. Accept request ID and completion notes
2. Add completion notes to the "Completion Notes" section
3. Update status to "done"
4. Move file to `done/` directory

---

## Expected Files

- `packages/web/src/server/routers/requests.ts` (modify)

---

## Acceptance Criteria

- [ ] `requests.close` procedure accepts `{ requestId, completionNotes }`
- [ ] Validates request is in `doing` status (can only close active work)
- [ ] Adds completion notes to the `## Completion Notes` section
- [ ] Updates `**Status**` to `done`
- [ ] Moves file from `doing/` to `done/`
- [ ] Returns success confirmation with final metadata

---

## Notes

This mirrors the CLI `choragen request:close` behavior. Completion notes should replace the placeholder text `[Added when moved to done/ - ...]`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
