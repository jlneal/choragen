# Task: Verify and close CR

**Chain**: CHAIN-038-cli-role-enforcement  
**Task**: 003-verify-close  
**Status**: backlog  
**Type**: control  
**Created**: 2025-12-08

---

## Objective

Verify all CR-20251207-021 acceptance criteria are met and close the request.

---

## Expected Files

Update:
- `docs/requests/change-requests/doing/CR-20251207-021-cli-role-enforcement.md` — Move to done/ with completion notes

---

## Acceptance Criteria

- [ ] `session:start`, `session:status`, `session:end` commands work
- [ ] `governance:check --role` flag works
- [ ] Session file is created/read/deleted correctly
- [ ] CR moved to done/ with completion notes

---

## Notes

This is a control-only task. Control agent executes directly—no impl handoff.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
