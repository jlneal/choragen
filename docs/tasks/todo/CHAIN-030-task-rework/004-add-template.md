# Task: Add Rework Task Template

**ID**: 004-add-template  
**Chain**: CHAIN-030-task-rework  
**Status**: todo  
**Agent**: impl  

---

## Objective

Create a template for rework task files and update the task:rework command to use it.

## Template Content

Create `templates/rework-task.md`:

```markdown
# Task: {{TITLE}} (Rework)

**ID**: {{TASK_ID}}  
**Chain**: {{CHAIN_ID}}  
**Status**: todo  
**Agent**: impl  
**Rework Of**: {{ORIGINAL_TASK_ID}}  
**Rework Reason**: {{REWORK_REASON}}  

---

## Original Task

See: [{{ORIGINAL_TASK_ID}}](./{{ORIGINAL_TASK_FILE}})

## Rework Requirements

{{REWORK_REASON}}

## What Needs to Change

[Impl agent: Detail the specific changes needed based on the rework reason]

## Acceptance Criteria

- [ ] Original issue addressed
- [ ] Original acceptance criteria still met
- [ ] No regressions introduced
```

## Integration

Update `task:rework` command to:
1. Read template from `templates/rework-task.md`
2. Replace placeholders with actual values
3. Write to task directory

## Files to Create/Modify

- Create: `templates/rework-task.md`
- Modify: `packages/cli/src/commands/task-rework.ts`

## Acceptance Criteria

- [ ] Template exists in `templates/`
- [ ] Template follows project conventions
- [ ] `task:rework` uses template
- [ ] Generated rework tasks are well-formatted
