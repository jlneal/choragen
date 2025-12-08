# Task: Verify and close CR

**Chain**: CHAIN-037-governance-roles  
**Task**: 003-verify-close  
**Status**: backlog  
**Type**: control  
**Created**: 2025-12-08

---

## Objective

Verify all CR-20251207-020 acceptance criteria are met and close the request.

---

## Expected Files

Update:
- `docs/requests/change-requests/doing/CR-20251207-020-governance-role-schema.md` — Move to done/ with completion notes

---

## Acceptance Criteria

- [ ] `choragen.governance.yaml` has `roles` section
- [ ] `@choragen/core` exports `AgentRole` type
- [ ] `@choragen/core` exports `checkMutationForRole` function
- [ ] Tests pass for role-based governance
- [ ] CR moved to done/ with completion notes

---

## Notes

This is a control-only task. Control agent executes directly—no impl handoff.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
