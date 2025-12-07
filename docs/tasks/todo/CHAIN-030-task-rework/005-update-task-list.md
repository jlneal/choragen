# Task: Update task:list for Rework Display

**ID**: 005-update-task-list  
**Chain**: CHAIN-030-task-rework  
**Status**: todo  
**Agent**: impl  

---

## Objective

Update the `task:list` command to distinguish rework tasks and show rework information.

## Changes

### List Output

Add indicator for rework tasks:

```
Tasks for CHAIN-028-commit-discipline:

  001-create-validator      done
  002-update-pre-push       done  
  003-implement-validator   done     [reworked: 1]
  003-implement-validator-rework-1   in-progress   [rework of: 003]
  004-verify-close          todo
```

### Detail View

When viewing a task that has been reworked:

```bash
choragen task:status CHAIN-028 003-implement-validator
```

Output:
```
Task: 003-implement-validator
Status: done
Rework Count: 1
Rework Tasks:
  - 003-implement-validator-rework-1 (in-progress)
```

When viewing a rework task:

```bash
choragen task:status CHAIN-028 003-implement-validator-rework-1
```

Output:
```
Task: 003-implement-validator-rework-1 (Rework)
Status: in-progress
Rework Of: 003-implement-validator
Rework Reason: Validator not checking staged files correctly
```

## Files to Modify

- `packages/cli/src/commands/task-list.ts` (or equivalent)
- `packages/cli/src/commands/task-status.ts` (or equivalent)

## Acceptance Criteria

- [ ] Rework tasks marked in list output
- [ ] Original tasks show rework count
- [ ] Task detail shows rework relationship
- [ ] Output is clear and scannable
