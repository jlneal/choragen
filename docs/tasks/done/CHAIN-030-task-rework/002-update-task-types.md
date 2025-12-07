# Task: Update Task Types in Core

**ID**: 002-update-task-types  
**Chain**: CHAIN-030-task-rework  
**Status**: todo  
**Agent**: impl  

---

## Objective

Add rework-related fields to the Task type in `@choragen/core`.

## Implementation

### Update Task Interface

```typescript
// packages/core/src/tasks/types.ts

interface Task {
  // ... existing fields
  
  /** ID of original task if this is a rework task */
  reworkOf?: string;
  
  /** Why rework was needed (set by control) */
  reworkReason?: string;
  
  /** Number of times this task has been reworked (on original task) */
  reworkCount?: number;
}
```

### Update TaskParser

Ensure `TaskParser` can read/write the new fields from task markdown files.

### Update TaskManager

Add method to increment `reworkCount` on original task when rework is created.

## Files to Modify

- `packages/core/src/tasks/types.ts`
- `packages/core/src/tasks/task-parser.ts`
- `packages/core/src/tasks/task-manager.ts`

## Acceptance Criteria

- [ ] Task type includes `reworkOf`, `reworkReason`, `reworkCount`
- [ ] TaskParser reads/writes new fields
- [ ] TaskManager can update `reworkCount`
- [ ] Existing tests still pass
- [ ] New fields are optional (backward compatible)
