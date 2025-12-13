# Task: Add fileScope field to Task and Chain types

**Chain**: CHAIN-068-file-scopes  
**Task**: 001-schema-updates  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add `fileScope: string[]` field to both Task and Chain interfaces in `packages/core/src/tasks/types.ts`. Update the task parser to read/write fileScope from task markdown files. Update chain manager to aggregate file scopes from tasks.

---

## Expected Files

- `packages/core/src/tasks/types.ts — Add fileScope to Task and Chain interfaces`
- `packages/core/src/tasks/task-parser.ts — Parse/serialize fileScope in task markdown`
- `packages/core/src/tasks/chain-manager.ts — Aggregate fileScope from tasks`
- `packages/core/src/tasks/__tests__/task-parser.test.ts — Tests for fileScope parsing`

---

## Acceptance Criteria

- [ ] Task interface has fileScope: string[] field (optional, defaults to empty array)
- [ ] Chain interface has fileScope: string[] field (optional, defaults to empty array)
- [ ] Task parser reads fileScope from markdown ## File Scope section
- [ ] Task parser serializes fileScope to markdown
- [ ] Chain manager aggregates fileScope from all tasks in chain
- [ ] CreateTaskOptions includes optional fileScope parameter
- [ ] All existing tests pass
- [ ] New tests for fileScope parsing added

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
