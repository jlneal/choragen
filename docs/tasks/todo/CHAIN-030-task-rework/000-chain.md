# Chain: CHAIN-030-task-rework

**Request**: CR-20251207-010  
**Created**: 2025-12-07  
**Status**: todo  

---

## Objective

Add formal rework handling to the task lifecycle. When control rejects a "complete" task, a new rework task is created that references the original, preserving traceability and enabling metrics.

## Tasks

| ID | Title | Status | Agent |
|----|-------|--------|-------|
| 001 | Create ADR for rework model | todo | impl |
| 002 | Update Task types in core | todo | impl |
| 003 | Implement task:rework command | todo | impl |
| 004 | Add rework task template | todo | impl |
| 005 | Update task:list for rework display | todo | impl |
| 006 | Verify and close | todo | control |

## Acceptance Criteria

- [ ] ADR documents rework model decisions
- [ ] `task:rework` command creates new task referencing original
- [ ] Original task's `reworkCount` is incremented
- [ ] Rework tasks distinguishable in `task:list`
- [ ] All tests pass, lint clean
