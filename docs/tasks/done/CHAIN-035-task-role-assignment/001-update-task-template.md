# Task: Update task template with Type field

**Chain**: CHAIN-035-task-role-assignment  
**Task**: 001-update-task-template  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Ensure the task template includes the `**Type**` field and that the CLI uses it when generating new tasks. Update `templates/AGENTS.md` to document the Type field.

---

## Expected Files

- `Update:`
- `templates/AGENTS.md — Document the Type field and when to use each value`
- `packages/cli/src/commands/task/add.ts — Include Type field in generated tasks`

---

## Acceptance Criteria

- [ ] Task template already has **Type**: impl field (verify)
- [ ] CLI task:add command includes **Type**: impl in generated task files
- [ ] templates/AGENTS.md documents the Type field with clear guidance on when to use impl vs control
- [ ] Generated tasks include the "Task Type Reference" section from template

---

## Notes

The template (`templates/task.md`) already has the Type field. The issue is that the CLI's `task:add` command doesn't include it in generated output.

**Verification**:
```bash
pnpm build
node packages/cli/dist/bin.js task:add CHAIN-035-task-role-assignment test-task "Test Task"
cat docs/tasks/backlog/CHAIN-035-task-role-assignment/004-test-task.md
# Should include **Type**: impl
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
