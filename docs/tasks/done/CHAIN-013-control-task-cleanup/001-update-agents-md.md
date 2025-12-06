# Task: Update AGENTS.md with Control-Only Task Procedure

**Chain**: CHAIN-013-control-task-cleanup  
**Task**: 001-update-agents-md  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add documentation for control-only tasks to AGENTS.md so control agents know to clean up their own tasks.

---

## Expected Files

Update:
- `AGENTS.md`

---

## Changes Required

Add a new subsection under "## Agent Roles" after the "Implementation Agent" section:

```markdown
### Control-Only Tasks

Some tasks are control agent responsibilities with no impl handoff:
- Verification tasks (e.g., "verify and close CR")
- Review tasks
- CR/FR closure tasks

For these tasks:
1. Control agent executes the task directly
2. Control agent updates task status to `done`
3. Control agent moves task file to `done/<CHAIN-ID>/`

Mark control-only tasks with `**Type**: control` in the task header.
```

---

## Acceptance Criteria

- [ ] AGENTS.md has "Control-Only Tasks" subsection
- [ ] Procedure clearly states control agent moves own tasks
- [ ] Examples of control-only task types listed

---

## Verification

```bash
grep -A 10 "Control-Only Tasks" AGENTS.md
```
