# Task: Implement task:rework Command

**ID**: 003-implement-command  
**Chain**: CHAIN-030-task-rework  
**Status**: todo  
**Agent**: impl  

---

## Objective

Implement the `choragen task:rework` CLI command.

## Command Specification

```bash
choragen task:rework <chain-id> <task-id> --reason "Description of what needs fixing"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `chain-id` | Yes | Chain containing the task |
| `task-id` | Yes | Task ID to create rework for |
| `--reason` | Yes | Why rework is needed |

### Behavior

1. Validate chain exists
2. Validate task exists and is in `done` or `in-review` status
3. Determine rework number (count existing reworks + 1)
4. Create new task file: `{task-id}-rework-{n}.md`
5. Set new task fields:
   - `reworkOf`: original task ID
   - `reworkReason`: from `--reason` flag
   - `status`: `todo`
6. Increment `reworkCount` on original task
7. Output new task ID and path

### Output

```
Creating rework task for 003-implement-validator...
  Original task: 003-implement-validator (done)
  Rework reason: Validator not checking staged files correctly
  Created: 003-implement-validator-rework-1
  Path: docs/tasks/todo/CHAIN-028/.../003-implement-validator-rework-1.md
✅ Rework task created

Handoff to impl agent:
  Chain: CHAIN-028-commit-discipline
  Task: 003-implement-validator-rework-1
```

### Error Cases

- Chain not found → error with suggestion
- Task not found → error listing available tasks
- Task not in done/in-review → error explaining valid statuses
- Missing --reason → error requiring reason

## Files to Create/Modify

- Create: `packages/cli/src/commands/task-rework.ts`
- Modify: `packages/cli/src/cli.ts` (register command)

## Acceptance Criteria

- [ ] Command registered and callable
- [ ] Creates rework task with correct fields
- [ ] Increments original task's reworkCount
- [ ] Validates task status before allowing rework
- [ ] Outputs handoff information for impl agent
- [ ] Error messages are helpful
