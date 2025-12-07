# Change Request: Task Rework Lifecycle

**ID**: CR-20251207-010  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Add formal rework handling to the task lifecycle. When control rejects a "complete" task, a new rework task is created that references the original, preserving traceability and enabling metrics.

## Motivation

Currently, when an implementation agent marks a task complete but control finds issues:
- There's no formal mechanism to document what was wrong
- No way to track rework frequency (a key quality signal)
- The original task's history is lost if we mutate it

Rework rate is a critical metric for:
- Agent performance evaluation
- Process improvement
- Identifying problematic task types

## Proposed Changes

### Task Model

Add rework-related fields:

```typescript
interface Task {
  // ... existing fields
  reworkOf?: string;        // ID of original task if this is a rework
  reworkReason?: string;    // Why rework was needed
  reworkCount?: number;     // How many times this task has been reworked (on original)
}
```

### New CLI Command

```bash
choragen task:rework <chain-id> <task-id> --reason "Description of what needs fixing"
```

**Behavior**:
1. Validates original task exists and is in `done` or `in-review` status
2. Creates new task file: `{original-id}-rework-{n}.md`
3. Sets `reworkOf` to original task ID
4. Increments `reworkCount` on original task
5. New task starts in `todo` status
6. Outputs new task ID for handoff to impl agent

### Task File Format

```markdown
# Task: Fix validation logic (Rework)

**ID**: 003-implement-validator-rework-1
**Chain**: CHAIN-028-commit-discipline
**Status**: todo
**Rework Of**: 003-implement-validator
**Rework Reason**: Validator not checking staged files correctly

---

## Original Task

[Link to original task]

## Rework Requirements

[What specifically needs to be fixed]
```

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | Task type, TaskManager |
| `@choragen/cli` | New `task:rework` command |
| Task templates | Rework task template |

## Acceptance Criteria

- [ ] `task:rework` command creates new task referencing original
- [ ] Original task's `reworkCount` is incremented
- [ ] Rework task includes reason and link to original
- [ ] Rework tasks are distinguishable in `task:list` output
- [ ] Metrics can query rework rate (count rework tasks / total tasks)

## Design Docs

- `docs/design/core/features/task-lifecycle.md` (to be updated)

## ADR Required

Yes - ADR for rework task model decisions

---

## Commits

[Populated by `choragen request:close`]
