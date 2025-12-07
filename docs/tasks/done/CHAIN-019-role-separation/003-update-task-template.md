# Task: Add Type field to task template

**Chain**: CHAIN-019-role-separation  
**Task**: 003-update-task-template  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Add a `**Type**: impl | control` field to the task template so every task explicitly declares its executor.

---

## Expected Files

- `templates/task.md (modified)`

---

## Acceptance Criteria

- [ ] Add **Type**: impl field after **Status**: line
- [ ] Add comment explaining valid values: impl (requires handoff) or control (control agent executes)
- [ ] Update any documentation in the template that references task execution

---

## Notes

- `impl` = Must be handed off to an implementation agent in a fresh session
- `control` = Control agent can execute directly (verify, review, close, commit tasks)
