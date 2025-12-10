# Task: Add requests.create tRPC procedure

**Chain**: CHAIN-053-request-management  
**Task**: 001-001-create-procedure  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Add a `requests.create` tRPC procedure to create new Change Requests or Fix Requests from the web UI.

The procedure should:
1. Accept request type (CR or FR), title, domain, and optional fields
2. Generate a unique ID following the pattern `CR-YYYYMMDD-NNN` or `FR-YYYYMMDD-NNN`
3. Create the markdown file in the appropriate `todo/` directory
4. Return the created request metadata

---

## Expected Files

- `packages/web/src/server/routers/requests.ts` (modify)

---

## Acceptance Criteria

- [ ] `requests.create` procedure accepts `{ type: 'cr' | 'fr', title, domain, description?, owner?, severity? }`
- [ ] Generates unique ID with date and sequence number
- [ ] Creates file at `docs/requests/{change-requests|fix-requests}/todo/{id}-{slug}.md`
- [ ] File content follows existing template format (see existing files in `todo/`)
- [ ] Returns created request metadata
- [ ] Handles duplicate ID edge case (increment sequence)

---

## Notes

Reference existing `parseRequestMetadata` function for the expected file format. The inverse operation (creating from metadata) should produce parseable files.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
