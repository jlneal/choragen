# ADR-008: Task Rework Model

**Status**: doing  
**Created**: 2025-12-07  
**Linked CR/FR**: CR-20251207-010  
**Linked Design Docs**: docs/design/core/features/task-chain-management.md

---

## Context

When a task fails review or requires changes after completion, we need a mechanism to track rework. This is critical for:

1. **Quality metrics**: Understanding rework rates reveals process issues
2. **Traceability**: Maintaining the audit trail when work is redone
3. **Agent accountability**: Tracking which tasks required multiple attempts
4. **Process improvement**: Identifying patterns in rework causes

The question is: how do we represent rework in the task system?

---

## Decision

### Create New Task for Rework

When a task requires rework, we create a **new task** rather than mutating the original. The original task remains in its completed state with a reference to the rework task.

### Task ID Format

Rework tasks use the format: `{original-id}-rework-{n}`

Examples:
- Original: `001-api-routes`
- First rework: `001-api-routes-rework-1`
- Second rework: `001-api-routes-rework-2`

### New Fields

Rework tasks include these additional fields:

```markdown
**reworkOf**: 001-api-routes
**reworkReason**: Review feedback - missing error handling
**reworkCount**: 1
```

| Field | Type | Description |
|-------|------|-------------|
| `reworkOf` | string | Task ID of the original task being reworked |
| `reworkReason` | string | Why rework was required (review feedback, bug found, etc.) |
| `reworkCount` | number | Which rework iteration this is (1, 2, 3...) |

### Status Flow

```
Original task: todo → in-progress → in-review → done
                                        ↓
                              [review fails]
                                        ↓
Rework task:   todo → in-progress → in-review → done
```

The original task stays in `done` (it was completed, just not accepted). The rework task tracks the correction work.

### Original Task Annotation

When rework is created, the original task gets an annotation:

```markdown
## Rework

- **Rework Task**: 001-api-routes-rework-1
- **Reason**: Review feedback - missing error handling
```

---

## Consequences

**Positive**:
- Full audit trail preserved - original work is not lost
- Metrics can track rework rate per chain, agent, or task type
- Clear separation between original attempt and corrections
- Git history shows complete timeline of all attempts
- Enables "first-time-right" quality metrics

**Negative**:
- More files in the task system
- Slightly more complex task queries (need to filter rework tasks or include them)
- Task IDs become longer with rework suffix

**Mitigations**:
- Archive completed chains to reduce file clutter
- Provide CLI filters: `choragen task:list --exclude-rework` or `--rework-only`
- Task ID length is bounded (max 2-3 reworks before escalation)

---

## Alternatives Considered

### Alternative 1: Mutate Existing Task

Reset the original task status back to `todo` or `in-progress` and continue working on it.

**Rejected because**:
- Loses history of the original completion
- Cannot calculate rework metrics (no record of how many attempts)
- Git history becomes confusing (same file moves back and forth)
- Violates immutability principle for completed work

### Alternative 2: Separate Rework Log

Keep a separate `rework-log.md` file that tracks rework events without creating new tasks.

**Rejected because**:
- Rework is real work that deserves task tracking
- Splits information across two systems
- Harder to assign and track rework progress
- Doesn't integrate with existing task workflow

### Alternative 3: Task Versioning

Create versions within the same task file (e.g., `## Version 2`).

**Rejected because**:
- Single file becomes cluttered with multiple attempts
- Harder to track status of each version
- Doesn't fit kanban directory model
- Complex parsing required

---

## Metrics Implications

This model enables the following quality metrics:

| Metric | Calculation |
|--------|-------------|
| **Rework Rate** | `rework_tasks / total_tasks` |
| **First-Time-Right** | `tasks_without_rework / total_tasks` |
| **Avg Rework Iterations** | `sum(reworkCount) / rework_tasks` |
| **Rework by Reason** | Group by `reworkReason` |
| **Rework by Chain Type** | Correlate with chain metadata |

These metrics inform process improvements and agent training.

---

## Implementation

[Added when moved to done/]

- `packages/core/src/tasks/rework-manager.ts`
- `packages/cli/src/commands/task-rework.ts`
