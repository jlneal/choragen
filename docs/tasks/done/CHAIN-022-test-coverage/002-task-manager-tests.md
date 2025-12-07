# Task: TaskManager unit tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 002-task-manager-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create comprehensive unit tests for TaskManager, which handles task lifecycle operations.

---

## Expected Files

- `Create: packages/core/src/tasks/__tests__/task-manager.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/task-chain-management.md
- [ ] Uses HttpStatus enum from @choragen/contracts (no magic numbers)
- [ ] Tests task creation (createTask)
- [ ] Tests task status transitions (backlog → todo → in-progress → in-review → done)
- [ ] Tests task retrieval (getTask, listTasks)
- [ ] Tests task movement between directories
- [ ] Tests Type field handling (impl vs control)
- [ ] Tests error cases (invalid transitions, missing task, etc.)
- [ ] All tests pass: pnpm --filter @choragen/core test

---

## Notes

Use temp directories for file system tests. Clean up after each test.
