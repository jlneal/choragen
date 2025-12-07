# Task: Verify and Close

**ID**: 006-verify-close  
**Chain**: CHAIN-030-task-rework  
**Status**: todo  
**Agent**: control  

---

## Objective

Verify the task rework lifecycle implementation and close CR-20251207-010.

## Verification Checklist

### ADR
- [ ] ADR-008 exists in `docs/adr/doing/` or `docs/adr/done/`
- [ ] Documents rework model decisions
- [ ] Links to CR-20251207-010

### Core Types
- [ ] Task type includes `reworkOf`, `reworkReason`, `reworkCount`
- [ ] Fields are optional (backward compatible)
- [ ] TaskParser handles new fields

### CLI Command
- [ ] `choragen task:rework` command works
- [ ] Creates rework task with correct ID format
- [ ] Sets all rework fields correctly
- [ ] Increments original task's reworkCount
- [ ] Validates task status before rework
- [ ] Provides helpful error messages

### Template
- [ ] `templates/rework-task.md` exists
- [ ] Generated tasks follow template

### Display
- [ ] `task:list` shows rework indicators
- [ ] Task detail shows rework relationships

### Quality
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (if tests exist)

## Test Scenario

1. Create a test chain with a task
2. Mark task as done
3. Run `task:rework` on it
4. Verify rework task created correctly
5. Verify original task's reworkCount updated
6. Verify `task:list` shows both correctly

## Post-Verification

1. Move ADR-008 to `done/` if still in `doing/`
2. Move all chain tasks to `done/`
3. Run: `choragen request:close CR-20251207-010`
4. Commit closure

## Commit Format

```
chore: close CR-20251207-010 task rework lifecycle

CR-20251207-010
```
