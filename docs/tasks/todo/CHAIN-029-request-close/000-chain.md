# Chain: CHAIN-029-request-close

**Request**: FR-20251207-004  
**Title**: Request Close Command  
**Type**: implementation  
**Skip Design**: true  
**Skip Design Justification**: CLI command extending existing patterns; FR serves as spec  
**Status**: todo  
**Created**: 2025-12-07  

---

## Objective

Add `choragen request:close <id>` command that populates commits and moves request to done.

---

## Tasks

1. `001-implement-command` - Implement request:close command
2. `002-verify-close` - Verify and close FR

---

## Acceptance Criteria

- [ ] `choragen request:close <id>` works
- [ ] Finds request in todo/ or doing/
- [ ] Populates ## Commits from git log
- [ ] Updates status to done
- [ ] Moves to done/
- [ ] Proper error handling
